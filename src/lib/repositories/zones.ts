import { supabase } from '../supabase';
import type { Zone } from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Interface définissant le contrat de persistance pour les zones.
 */
export interface ZoneRepository {
  getAll(mapId: string): Promise<Zone[]>;
  create(mapId: string, zone: Omit<Zone, 'id' | 'map_id' | 'created_at'>): Promise<Zone>;
  update(id: string, updates: Partial<Zone>): Promise<void>;
  delete(id: string): Promise<void>;
  subscribe(mapId: string, callback: (payload: RealtimePostgresChangesPayload<Zone>) => void): () => void;
}

/**
 * Implémentation concrète pour Supabase.
 */
export const supabaseZoneRepository: ZoneRepository = {
  async getAll(mapId) {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('map_id', mapId);
    if (error) throw error;
    return data || [];
  },

  async create(mapId, zone) {
    const { data, error } = await supabase
      .from('zones')
      .insert([{ ...zone, map_id: mapId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { error } = await supabase
      .from('zones')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribe(mapId, callback) {
    const channel = supabase
      .channel(`public:zones:${mapId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zones', filter: `map_id=eq.${mapId}` },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const zoneRepo = supabaseZoneRepository;
