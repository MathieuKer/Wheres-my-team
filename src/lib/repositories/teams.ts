import { supabase } from '../supabase';
import type { Team } from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Interface définissant le contrat de persistance pour les équipes.
 * C'est notre "Seam" (couture) : on peut changer l'implémentation sans toucher au reste.
 */
export interface TeamRepository {
  getAll(): Promise<Team[]>;
  create(name: string, color: string): Promise<void>;
  update(id: string, updates: Partial<Team>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  subscribe(callback: (payload: RealtimePostgresChangesPayload<Team>) => void): () => void;
}

/**
 * Implémentation concrète pour Supabase.
 */
export const supabaseTeamRepository: TeamRepository = {
  async getAll() {
    const { data, error } = await supabase.from('teams').select('*');
    if (error) throw error;
    return data || [];
  },

  async create(name, color) {
    const { error } = await supabase.from('teams').insert([{ name, color }]);
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

  async deleteAll() {
    const { error } = await supabase
      .from('teams')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  },

  subscribe(callback) {
    const channel = supabase
      .channel('public:teams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
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
