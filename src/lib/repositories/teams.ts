import { supabase } from '../supabase';
import type { Team, TeamSpecialty } from '../../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { inferSpecialtyFromName } from '../specialties';

/**
 * Interface définissant le contrat de persistance pour les équipes.
 * C'est notre "Seam" (couture) : on peut changer l'implémentation sans toucher au reste.
 */
export interface TeamRepository {
  getAll(mapId: string): Promise<Team[]>;
  create(mapId: string, name: string, color: string, specialty?: TeamSpecialty | null): Promise<void>;
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
    return (data || []).map((t: Team) => {
      let specialty = t.specialty;
      let description = t.description;
      if (!specialty && description && description.includes('[specialty:')) {
        const match = /\[specialty:(terrain|volante|superviseur|coordo|kart)\]/.exec(description);
        if (match) {
          specialty = match[1] as TeamSpecialty;
          description = description.replace(/\[specialty:(terrain|volante|superviseur|coordo|kart)\]\s*/g, '').trim() || null;
        }
      }
      if (!specialty) {
        specialty = inferSpecialtyFromName(t.name);
      }
      return {
        ...t,
        specialty,
        description
      };
    });
  },

  async create(mapId, name, color, specialty = 'terrain') {
    if (!mapId) {
      throw new Error("mapId is required to create a team");
    }
    const targetSpecialty = specialty || 'terrain';
    const insertPayload: Record<string, unknown> = { map_id: mapId, name, color, specialty: targetSpecialty };
    const { error } = await supabase.from('teams').insert([insertPayload]);
    if (error) {
      // Fallback si la colonne n'est pas présente dans l'instance Postgres distante
      if (error.message?.includes('specialty') || error.code === '42703') {
        const fallbackPayload: Record<string, unknown> = { 
          map_id: mapId, 
          name, 
          color,
          description: targetSpecialty !== 'terrain' ? `[specialty:${targetSpecialty}]` : null
        };
        const { error: retryError } = await supabase.from('teams').insert([fallbackPayload]);
        if (retryError) throw retryError;
        return;
      }
      throw error;
    }
  },

  async update(id, updates) {
    const { error } = await supabase.from('teams').update(updates).eq('id', id);
    if (error) {
      if (error.message?.includes('specialty') || error.code === '42703') {
        const { specialty, ...rest } = updates;
        if (specialty !== undefined) {
          const { data: currentTeam } = await supabase.from('teams').select('description').eq('id', id).single();
          const cleanDesc = (currentTeam?.description || '').replace(/\[specialty:(terrain|volante|superviseur|coordo|kart)\]\s*/g, '').trim();
          const newDesc = specialty && specialty !== 'terrain'
            ? `[specialty:${specialty}] ${cleanDesc}`.trim()
            : cleanDesc || null;
          rest.description = newDesc;
        }
        if (Object.keys(rest).length > 0) {
          const { error: retryError } = await supabase.from('teams').update(rest).eq('id', id);
          if (retryError) throw retryError;
        }
        return;
      }
      throw error;
    }
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
