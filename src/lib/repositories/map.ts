import { supabase } from '../supabase';
import type { SquadMap } from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface MapRepository {
  getAll(): Promise<SquadMap[]>;
  getById(id: string): Promise<SquadMap>;
  create(name: string, has_interventions?: boolean): Promise<SquadMap>;
  update(id: string, updates: Partial<SquadMap>): Promise<void>;
  delete(id: string): Promise<void>;
  subscribe(callback: (payload: RealtimePostgresChangesPayload<SquadMap>) => void): () => void;
}

export const supabaseMapRepository: MapRepository = {
  async getAll() {
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(name, has_interventions = false) {
    // RLS will automatically set owner_id if we do it via a function, but here we let the DB handle it if possible, 
    // OR we must supply owner_id. Let's retrieve user id.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { data, error } = await supabase
      .from('maps')
      .insert([{ name, owner_id: user.id, has_interventions }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { error } = await supabase
      .from('maps')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id) {
    const { error } = await supabase
      .from('maps')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribe(callback) {
    const channel = supabase
      .channel('public:maps')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maps' },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const mapRepo = supabaseMapRepository;
