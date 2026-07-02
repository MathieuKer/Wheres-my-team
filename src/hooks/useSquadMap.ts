import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { teamsRepo } from '../lib/repositories/teams';
import { mapRepo } from '../lib/repositories/map';
import { zoneRepo } from '../lib/repositories/zones';
import { interventionsRepo } from '../lib/repositories/interventions';
import type { TeamStatus, Zone, SquadMap, Intervention } from '../types';

/**
 * Orchestrateur de domaine "SquadMap".
 * Implémentation profonde gérant la persistance via les Repositories.
 */
export function useSquadMap(mapId: string | null) {
  const { data: teams = [], isLoading: loadingTeams } = useSWR(mapId ? ['teams', mapId] : null, () => teamsRepo.getAll(mapId!));
  const { data: mapSettings, isLoading: loadingMap } = useSWR(mapId ? ['map', mapId] : null, () => mapRepo.getById(mapId!));
  const { data: zones = [], isLoading: loadingZones } = useSWR(mapId ? ['zones', mapId] : null, () => zoneRepo.getAll(mapId!));
  const { data: interventions = [], isLoading: loadingInterventions } = useSWR(mapId ? ['interventions', mapId] : null, () => interventionsRepo.getAll(mapId!));

  const [isAdding, setIsAdding] = useState(false);
  const [mode, setMode] = useState<'reader' | 'deployment' | 'edition'>('reader');

  useEffect(() => {
    if (!mapId) return;
    
    const unsubscribeTeams = teamsRepo.subscribe(mapId, () => {
      mutate(['teams', mapId]);
    });
    
    const unsubscribeMap = mapRepo.subscribe((payload) => {
      if (payload.new && (payload.new as SquadMap).id === mapId) {
        mutate(['map', mapId]);
      }
    });
    
    const unsubscribeZones = zoneRepo.subscribe(mapId, () => {
      mutate(['zones', mapId]);
    });

    const unsubscribeInterventions = interventionsRepo.subscribe(mapId, () => {
      mutate(['interventions', mapId]);
    });
    
    return () => {
      unsubscribeTeams();
      unsubscribeMap();
      unsubscribeZones();
      unsubscribeInterventions();
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
    mutate(['interventions', mapId], [], false);
    await teamsRepo.deleteAll(mapId);
    await interventionsRepo.deleteAll(mapId);
  }, [mapId]);

  const toggleIntervention = useCallback((id: string, currentStatus: TeamStatus) => {
    const newStatus = currentStatus === 'intervention' ? 'dispo' : 'intervention';
    updateTeamStatus(id, newStatus);
  }, [updateTeamStatus]);

  const requestFlush = useCallback(() => {
    if (globalThis.confirm("Êtes-vous sûr de vouloir supprimer toutes les équipes et interventions ? Cette action est irréversible.")) {
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

  // --- ACTIONS INTERVENTIONS ---
  const addIntervention = useCallback(async (description: string, priority: string, posX = 50, posY = 50) => {
    if (!mapId) return null;
    const newInt = await interventionsRepo.create(mapId, description, priority, posX, posY);
    mutate(['interventions', mapId]);
    return newInt;
  }, [mapId]);

  const updateIntervention = useCallback(async (id: string, updates: Partial<Intervention>) => {
    if (!mapId) return;

    // Apply cascading auto-status updates if assigned_team_id changed
    if ('assigned_team_id' in updates) {
      const oldTeamId = interventions.find(i => i.id === id)?.assigned_team_id;
      const teamId = updates.assigned_team_id;

      // Release the old team to 'dispo' if it was replaced or unassigned
      if (oldTeamId && oldTeamId !== teamId) {
        await updateTeamStatus(oldTeamId, 'dispo');
      }

      if (teamId) {
        updates.status = 'assigned';

        // Unassign this team from any other intervention first to prevent dual assignment
        const otherInts = interventions.filter(i => i.assigned_team_id === teamId && i.id !== id);
        for (const otherInt of otherInts) {
          await interventionsRepo.update(otherInt.id, { assigned_team_id: null, status: 'open' });
        }

        // Auto transition team status to 'en_route' if they were dispo or pause
        const team = teams.find(t => t.id === teamId);
        if (team && (team.status === 'dispo' || team.status === 'pause')) {
          await updateTeamStatus(teamId, 'en_route');
        }
      } else {
        updates.status = 'open';
      }
    }

    mutate(
      ['interventions', mapId],
      interventions.map(i => {
        if (i.id === id) {
          return { ...i, ...updates };
        }
        if (updates.assigned_team_id && i.assigned_team_id === updates.assigned_team_id && i.id !== id) {
          return { ...i, assigned_team_id: null, status: 'open' };
        }
        return i;
      }),
      false
    );
    await interventionsRepo.update(id, updates);
    mutate(['interventions', mapId]);
  }, [mapId, interventions, teams, updateTeamStatus]);

  const deleteIntervention = useCallback(async (id: string) => {
    if (!mapId) return;
    
    // Auto release assigned team to dispo
    const intToClose = interventions.find(i => i.id === id);
    if (intToClose?.assigned_team_id) {
      await updateTeamStatus(intToClose.assigned_team_id, 'dispo');
    }

    mutate(['interventions', mapId], interventions.filter(i => i.id !== id), false);
    await interventionsRepo.delete(id);
  }, [mapId, interventions, updateTeamStatus]);

  const flushInterventions = useCallback(async () => {
    if (!mapId) return;

    // Auto release all assigned teams to dispo
    const assignedTeamIds = interventions
      .filter(i => i.assigned_team_id !== null)
      .map(i => i.assigned_team_id as string);

    for (const teamId of assignedTeamIds) {
      await updateTeamStatus(teamId, 'dispo');
    }

    mutate(['interventions', mapId], [], false);
    await interventionsRepo.deleteAll(mapId);
  }, [mapId, interventions, updateTeamStatus]);

  const updateInterventionsPositions = useCallback(async (moves: { id: string; x: number; y: number }[]) => {
    if (!mapId || moves.length === 0) return;
    const moveMap = new Map(moves.map(m => [m.id, m]));
    mutate(
      ['interventions', mapId], 
      interventions.map(i => {
        const move = moveMap.get(i.id);
        return move ? { ...i, pos_x: move.x, pos_y: move.y } : i;
      }), 
      false
    );
    await Promise.all(moves.map(m => interventionsRepo.update(m.id, { pos_x: m.x, pos_y: m.y })));
    mutate(['interventions', mapId]);
  }, [mapId, interventions]);

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
    addIntervention,
    updateIntervention,
    deleteIntervention,
    flushInterventions,
    updateInterventionsPositions,
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
    addIntervention,
    updateIntervention,
    deleteIntervention,
    flushInterventions,
    updateInterventionsPositions,
    setMode
  ]);

  return {
    state: {
      teams,
      zones,
      interventions,
      mode,
      mapUrl: mapSettings?.image_url ?? null,
      loading: loadingTeams || loadingMap || loadingZones || loadingInterventions
    },
    actions: memoizedActions
  };
}
