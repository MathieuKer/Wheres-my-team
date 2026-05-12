import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Team, TeamStatus } from '../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

function insertTeam(prev: Team[], newTeam: Team): Team[] {
  return [...prev, newTeam];
}

function updateTeamInList(prev: Team[], updatedTeam: Team): Team[] {
  return prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t));
}

function removeTeamFromList(prev: Team[], deletedId: string): Team[] {
  return prev.filter((t) => t.id !== deletedId);
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les équipes initiales
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('teams').select('*');
      if (error) {
        console.error('Error fetching teams:', error);
      } else {
        setTeams(data || []);
      }
      setLoading(false);
    };

    fetchTeams();

    const handleTeamsChange = (payload: RealtimePostgresChangesPayload<Team>) => {
      if (payload.eventType === 'INSERT') {
        setTeams((prev) => insertTeam(prev, payload.new as Team));
      } else if (payload.eventType === 'UPDATE') {
        setTeams((prev) => updateTeamInList(prev, payload.new as Team));
      } else if (payload.eventType === 'DELETE') {
        setTeams((prev) => removeTeamFromList(prev, (payload.old as { id: string }).id));
      }
    };

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('public:teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        handleTeamsChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTeam = async (name: string, color: string) => {
    const { error } = await supabase.from('teams').insert([{ name, color }]);
    if (error) console.error('Error adding team:', error);
  };

  const updateTeamPosition = async (id: string, pos_x: number, pos_y: number) => {
    // Optimistic UI update
    setTeams(prev => prev.map(t => (t.id === id ? { ...t, pos_x, pos_y } : t)));
    
    const { error } = await supabase
      .from('teams')
      .update({ pos_x, pos_y })
      .eq('id', id);
    if (error) console.error('Error updating position:', error);
  };

  const updateTeamColor = async (id: string, color: string) => {
    setTeams(prev => prev.map(t => (t.id === id ? { ...t, color } : t)));
    const { error } = await supabase.from('teams').update({ color }).eq('id', id);
    if (error) console.error('Error updating color:', error);
  };

  const updateTeamStatus = async (id: string, status: TeamStatus) => {
    // Optimistic UI update
    setTeams(prev => prev.map(t => (t.id === id ? { ...t, status } : t)));
    
    const { error } = await supabase
      .from('teams')
      .update({ status })
      .eq('id', id);
    if (error) console.error('Error updating status:', error);
  };
  
  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) console.error('Error deleting team:', error);
  };

  const flushAll = async () => {
    const { error } = await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Supprime tout
    if (error) console.error('Error flushing teams:', error);
  };

  return {
    teams,
    loading,
    addTeam,
    updateTeamPosition,
    updateTeamColor,
    updateTeamStatus,
    deleteTeam,
    flushAll
  };
}
