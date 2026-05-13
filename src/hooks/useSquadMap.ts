import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { teamsRepo } from '../lib/repositories/teams';
import { mapRepo } from '../lib/repositories/map';
import type { TeamStatus } from '../types';

/**
 * Orchestrateur de domaine "SquadMap".
 * Implémentation profonde gérant la persistance via les Repositories.
 */
export function useSquadMap() {
  const { data: teams = [], isLoading: loadingTeams } = useSWR('teams', () => teamsRepo.getAll());
  const { data: mapSettings, isLoading: loadingMap } = useSWR('map', () => mapRepo.getSettings());

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubscribeTeams = teamsRepo.subscribe(() => {
      mutate('teams');
    });
    const unsubscribeMap = mapRepo.subscribe(() => {
      mutate('map');
    });
    return () => {
      unsubscribeTeams();
      unsubscribeMap();
    };
  }, []);

  const addTeam = async (name: string, color: string) => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      await teamsRepo.create(name, color);
      mutate('teams');
    } finally {
      setIsAdding(false);
    }
  };

  const updateTeamPosition = async (id: string, x: number, y: number) => {
    // Optimistic UI : on met à jour localement d'abord pour une interface fluide
    mutate('teams', teams.map(t => t.id === id ? { ...t, pos_x: x, pos_y: y } : t), false);
    await teamsRepo.update(id, { pos_x: x, pos_y: y });
  };

  const updateTeamColor = async (id: string, color: string) => {
    mutate('teams', teams.map(t => t.id === id ? { ...t, color } : t), false);
    await teamsRepo.update(id, { color });
  };

  const updateTeamStatus = async (id: string, status: TeamStatus) => {
    mutate('teams', teams.map(t => t.id === id ? { ...t, status } : t), false);
    await teamsRepo.update(id, { status });
  };

  const deleteTeam = async (id: string) => {
    mutate('teams', teams.filter(t => t.id !== id), false);
    await teamsRepo.delete(id);
  };

  const flushAll = async () => {
    mutate('teams', [], false);
    await teamsRepo.deleteAll();
  };

  const toggleIntervention = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'intervention' ? 'dispo' : 'intervention';
    updateTeamStatus(id, newStatus as TeamStatus);
  };

  const requestFlush = () => {
    if (globalThis.confirm("Êtes-vous sûr de vouloir supprimer toutes les équipes ? Cette action est irréversible.")) {
      flushAll();
    }
  };

  const updateMapUrl = async (url: string | null) => {
    mutate('map', { image_url: url }, false);
    await mapRepo.updateImageUrl(url);
  };

  return {
    state: {
      teams,
      mapUrl: mapSettings?.image_url ?? null,
      loading: loadingTeams || loadingMap
    },
    actions: {
      addTeam,
      updateTeamPosition,
      updateTeamColor,
      updateTeamStatus,
      deleteTeam,
      updateMapUrl,
      toggleIntervention,
      requestFlush
    }
  };
}
