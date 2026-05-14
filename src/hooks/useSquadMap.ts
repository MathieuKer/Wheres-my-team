import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { teamsRepo } from '../lib/repositories/teams';
import { mapRepo } from '../lib/repositories/map';
import type { TeamStatus } from '../types';

/**
 * Orchestrateur de domaine "SquadMap".
 * Implémentation profonde gérant la persistance via les Repositories.
 */
export function useSquadMap(mapId: string | null) {
  const { data: teams = [], isLoading: loadingTeams } = useSWR(mapId ? ['teams', mapId] : null, () => teamsRepo.getAll(mapId!));
  const { data: mapSettings, isLoading: loadingMap } = useSWR(mapId ? ['map', mapId] : null, () => mapRepo.getById(mapId!));

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!mapId) return;
    
    const unsubscribeTeams = teamsRepo.subscribe(mapId, () => {
      mutate(['teams', mapId]);
    });
    
    // We don't have a mapId specific subscribe on mapRepo yet, but we can subscribe to all and filter, 
    // or just rely on the mapRepo.subscribe implementation. For now it listens to all maps.
    const unsubscribeMap = mapRepo.subscribe((payload) => {
      if (payload.new && (payload.new as any).id === mapId) {
        mutate(['map', mapId]);
      }
    });
    
    return () => {
      unsubscribeTeams();
      unsubscribeMap();
    };
  }, [mapId]);

  const addTeam = useCallback(async (name: string, color: string) => {
    if (isAdding || !mapId) return;
    setIsAdding(true);
    try {
      await teamsRepo.create(mapId, name, color);
      mutate(['teams', mapId]);
    } finally {
      setIsAdding(false);
    }
  }, [mapId, isAdding]);

  const updateTeamPosition = useCallback(async (id: string, x: number, y: number) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.map(t => t.id === id ? { ...t, pos_x: x, pos_y: y } : t), false);
    await teamsRepo.update(id, { pos_x: x, pos_y: y });
  }, [mapId, teams]);

  const updateTeamColor = useCallback(async (id: string, color: string) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.map(t => t.id === id ? { ...t, color } : t), false);
    await teamsRepo.update(id, { color });
  }, [mapId, teams]);

  const updateTeamStatus = useCallback(async (id: string, status: TeamStatus) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.map(t => t.id === id ? { ...t, status } : t), false);
    await teamsRepo.update(id, { status });
  }, [mapId, teams]);

  const deleteTeam = useCallback(async (id: string) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.filter(t => t.id !== id), false);
    await teamsRepo.delete(id);
  }, [mapId, teams]);

  const flushAll = useCallback(async () => {
    if (!mapId) return;
    mutate(['teams', mapId], [], false);
    await teamsRepo.deleteAll(mapId);
  }, [mapId]);

  const toggleIntervention = useCallback((id: string, currentStatus: TeamStatus) => {
    const newStatus = currentStatus === 'intervention' ? 'dispo' : 'intervention';
    updateTeamStatus(id, newStatus);
  }, [updateTeamStatus]);

  const requestFlush = useCallback(() => {
    if (globalThis.confirm("Êtes-vous sûr de vouloir supprimer toutes les équipes ? Cette action est irréversible.")) {
      flushAll();
    }
  }, [flushAll]);

  const updateMapUrl = useCallback(async (url: string | null) => {
    if (!mapId) return;
    mutate(['map', mapId], { ...mapSettings, image_url: url }, false);
    await mapRepo.update(mapId, { image_url: url });
  }, [mapId, mapSettings]);

  const memoizedActions = useMemo(() => ({
    addTeam,
    updateTeamPosition,
    updateTeamColor,
    updateTeamStatus,
    deleteTeam,
    updateMapUrl,
    toggleIntervention,
    requestFlush
  }), [
    addTeam,
    updateTeamPosition,
    updateTeamColor,
    updateTeamStatus,
    deleteTeam,
    updateMapUrl,
    toggleIntervention,
    requestFlush
  ]);

  return {
    state: {
      teams,
      mapUrl: mapSettings?.image_url ?? null,
      loading: loadingTeams || loadingMap
    },
    actions: memoizedActions
  };
}
