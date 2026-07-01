export type TeamStatus = 'dispo' | 'intervention' | 'pause' | 'en_route';

export interface Team {
  id: string;
  map_id: string;
  name: string;
  color: string;
  pos_x: number;
  pos_y: number;
  status: TeamStatus;
  description?: string | null;
  updated_at: string;
}

export interface SquadMap {
  id: string;
  name: string;
  owner_id: string;
  image_url: string | null;
  created_at: string;
}

export interface Zone {
  id: string;
  map_id: string;
  name: string;
  color: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation: number;
  type?: string;
  font_size?: number;
  opacity?: number;
  created_at: string;
}

export type InterventionPriority = 'P0' | 'P1' | 'P3' | 'P5';

export interface Intervention {
  id: string;
  map_id: string;
  number: number;
  description: string;
  priority: InterventionPriority;
  status: 'open' | 'assigned';
  pos_x: number;
  pos_y: number;
  assigned_team_id: string | null;
  created_at: string;
}
