import { supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface MapSettings {
  image_url: string | null;
}

export interface MapRepository {
  getSettings(): Promise<MapSettings>;
  updateImageUrl(url: string | null): Promise<void>;
  subscribe(callback: (payload: RealtimePostgresChangesPayload<any>) => void): () => void;
}

export const supabaseMapRepository: MapRepository = {
  async getSettings() {
    const { data, error } = await supabase
      .from('map_settings')
      .select('image_url')
      .eq('id', 1)
      .single();
    
    if (error) throw error;
    return data as MapSettings;
  },

  async updateImageUrl(url) {
    const { error } = await supabase
      .from('map_settings')
      .update({ image_url: url })
      .eq('id', 1);
    
    if (error) throw error;
  },

  subscribe(callback) {
    const channel = supabase
      .channel('public:map_settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'map_settings' },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const mapRepo = supabaseMapRepository;
