import { supabase } from '../supabase';
import type { Intervention } from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Interface defining the persistence contract for Interventions.
 */
export interface InterventionRepository {
  getAll(mapId: string): Promise<Intervention[]>;
  create(mapId: string, description: string, priority: string, posX: number, posY: number): Promise<Intervention>;
  update(id: string, updates: Partial<Intervention>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(mapId: string): Promise<void>;
  subscribe(mapId: string, callback: (payload: RealtimePostgresChangesPayload<Intervention>) => void): () => void;
}

/**
 * Concrete implementation for Supabase.
 */
export const supabaseInterventionRepository: InterventionRepository = {
  async getAll(mapId) {
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('map_id', mapId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(mapId, description, priority, posX, posY) {
    if (!mapId) {
      throw new Error("mapId is required to create an intervention");
    }
    const { data, error } = await supabase.from('interventions').insert([
      {
        map_id: mapId,
        description,
        priority,
        pos_x: posX,
        pos_y: posY,
        status: 'open'
      }
    ]).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { error } = await supabase.from('interventions').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase.from('interventions').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteAll(mapId) {
    const { error: deleteError } = await supabase
      .from('interventions')
      .delete()
      .eq('map_id', mapId);
    if (deleteError) throw deleteError;

    const { error: updateError } = await supabase
      .from('maps')
      .update({ last_intervention_number: 0 })
      .eq('id', mapId);
    if (updateError) throw updateError;
  },

  subscribe(mapId, callback) {
    const channel = supabase
      .channel(`public:interventions:${mapId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interventions', filter: `map_id=eq.${mapId}` },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const interventionsRepo = supabaseInterventionRepository;
