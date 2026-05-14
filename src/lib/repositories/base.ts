import { supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function createRepository<T extends { id: string }>(tableName: string) {
  return {
    async getAll(mapId: string): Promise<T[]> {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('map_id', mapId);
      if (error) throw error;
      return data || [];
    },

    async create(mapId: string, item: Omit<T, 'id' | 'map_id' | 'created_at' | 'updated_at'>): Promise<T> {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...item, map_id: mapId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<T>): Promise<void> {
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    subscribe(mapId: string, callback: (payload: RealtimePostgresChangesPayload<T>) => void): () => void {
      const channel = supabase
        .channel(`public:${tableName}:${mapId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName, filter: `map_id=eq.${mapId}` },
          callback
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  };
}
