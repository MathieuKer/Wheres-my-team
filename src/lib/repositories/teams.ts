import { supabase } from '../supabase';
import type { Team } from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Interface définissant le contrat de persistance pour les équipes.
 * C'est notre "Seam" (couture) : on peut changer l'implémentation sans toucher au reste.
 */
export interface TeamRepository {
  getAll(mapId: string): Promise<Team[]>;
  create(mapId: string, name: string, color: string): Promise<void>;
  update(id: string, updates: Partial<Team>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(mapId: string): Promise<void>;
  subscribe(mapId: string, callback: (payload: RealtimePostgresChangesPayload<Team>) => void): () => void;
}

/**
 * Implémentation concrète pour Supabase.
 */
export const supabaseTeamRepository: TeamRepository = {
  async getAll(mapId) {
    const { data, error } = await supabase.from('teams').select('*').eq('map_id', mapId);
    if (error) throw error;
    return data || [];
  },

  async create(mapId, name, color) {
    const { error } = await supabase.from('teams').insert([{ map_id: mapId, name, color }]);
    if (error) throw error;
  },

  async update(id, updates) {
    const { error } = await supabase.from('teams').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteAll(mapId) {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('map_id', mapId);
    if (error) throw error;
  },

  subscribe(mapId, callback) {
    const channel = supabase
      .channel(`public:teams:${mapId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `map_id=eq.${mapId}` },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

// Par défaut, on utilise Supabase, mais on pourrait facilement changer ici.
export const teamsRepo = supabaseTeamRepository;
