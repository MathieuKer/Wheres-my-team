export type TeamStatus = 'dispo' | 'intervention' | 'pause';

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
  created_at: string;
}
