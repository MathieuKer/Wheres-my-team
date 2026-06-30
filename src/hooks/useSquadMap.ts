import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { teamsRepo } from '../lib/repositories/teams';
import { mapRepo } from '../lib/repositories/map';
import { zoneRepo } from '../lib/repositories/zones';
import type { TeamStatus, Zone, SquadMap } from '../types';

/**
 * Orchestrateur de domaine "SquadMap".
 * Implémentation profonde gérant la persistance via les Repositories.
 */
export function useSquadMap(mapId: string | null) {
  const { data: teams = [], isLoading: loadingTeams } = useSWR(mapId ? ['teams', mapId] : null, () => teamsRepo.getAll(mapId!));
  const { data: mapSettings, isLoading: loadingMap } = useSWR(mapId ? ['map', mapId] : null, () => mapRepo.getById(mapId!));
  const { data: zones = [], isLoading: loadingZones } = useSWR(mapId ? ['zones', mapId] : null, () => zoneRepo.getAll(mapId!));

  const [isAdding, setIsAdding] = useState(false);
  const [mode, setMode] = useState<'reader' | 'deployment' | 'edition'>('reader');

  useEffect(() => {
    if (!mapId) return;
    
    const unsubscribeTeams = teamsRepo.subscribe(mapId, () => {
      mutate(['teams', mapId]);
    });
    
    // We don't have a mapId specific subscribe on mapRepo yet, but we can subscribe to all and filter, 
    // or just rely on the mapRepo.subscribe implementation. For now it listens to all maps.
    const unsubscribeMap = mapRepo.subscribe((payload) => {
      if (payload.new && (payload.new as SquadMap).id === mapId) {
        mutate(['map', mapId]);
      }
    });
    
    const unsubscribeZones = zoneRepo.subscribe(mapId, () => {
      mutate(['zones', mapId]);
    });
    
    return () => {
      unsubscribeTeams();
      unsubscribeMap();
      unsubscribeZones();
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

  const updateTeamsPositions = useCallback(async (moves: { id: string; x: number; y: number }[]) => {
    if (!mapId || moves.length === 0) return;
    const moveMap = new Map(moves.map(m => [m.id, m]));
    mutate(
      ['teams', mapId], 
      teams.map(t => {
        const move = moveMap.get(t.id);
        return move ? { ...t, pos_x: move.x, pos_y: move.y } : t;
      }), 
      false
    );
    await Promise.all(moves.map(m => teamsRepo.update(m.id, { pos_x: m.x, pos_y: m.y })));
    mutate(['teams', mapId]);
  }, [mapId, teams]);

  const updateTeamColor = useCallback(async (id: string, color: string) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.map(t => t.id === id ? { ...t, color } : t), false);
    await teamsRepo.update(id, { color });
  }, [mapId, teams]);

  const updateTeamName = useCallback(async (id: string, name: string) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.map(t => t.id === id ? { ...t, name } : t), false);
    await teamsRepo.update(id, { name });
  }, [mapId, teams]);

  const updateTeamStatus = useCallback(async (id: string, status: TeamStatus) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.map(t => t.id === id ? { ...t, status } : t), false);
    await teamsRepo.update(id, { status });
  }, [mapId, teams]);

  const updateTeamDescription = useCallback(async (id: string, description: string | null) => {
    if (!mapId) return;
    mutate(['teams', mapId], teams.map(t => t.id === id ? { ...t, description } : t), false);
    await teamsRepo.update(id, { description });
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

  // --- ACTIONS ZONES ---
  const addZone = useCallback(async (zone: Omit<Zone, 'id' | 'map_id' | 'created_at'>) => {
    if (!mapId) return;
    try {
      const newZone = await zoneRepo.create(mapId, zone);
      mutate(['zones', mapId], [...zones, newZone], false);
    } catch (err) {
      console.error("Erreur création zone:", err);
    }
  }, [mapId, zones]);

  const updateZone = useCallback(async (id: string, updates: Partial<Zone>) => {
    if (!mapId) return;
    mutate(['zones', mapId], zones.map(z => z.id === id ? { ...z, ...updates } : z), false);
    await zoneRepo.update(id, updates);
  }, [mapId, zones]);

  const deleteZone = useCallback(async (id: string) => {
    if (!mapId) return;
    mutate(['zones', mapId], zones.filter(z => z.id !== id), false);
    await zoneRepo.delete(id);
  }, [mapId, zones]);

  const memoizedActions = useMemo(() => ({
    addTeam,
    updateTeamPosition,
    updateTeamsPositions,
    updateTeamColor,
    updateTeamName,
    updateTeamStatus,
    updateTeamDescription,
    deleteTeam,
    updateMapUrl,
    toggleIntervention,
    requestFlush,
    addZone,
    updateZone,
    deleteZone,
    setMode
  }), [
    addTeam,
    updateTeamPosition,
    updateTeamsPositions,
    updateTeamColor,
    updateTeamName,
    updateTeamStatus,
    updateTeamDescription,
    deleteTeam,
    updateMapUrl,
    toggleIntervention,
    requestFlush,
    addZone,
    updateZone,
    deleteZone,
    setMode
  ]);

  return {
    state: {
      teams,
      zones,
      mode,
      mapUrl: mapSettings?.image_url ?? null,
      loading: loadingTeams || loadingMap || loadingZones
    },
    actions: memoizedActions
  };
}
