export type TeamStatus = 'dispo' | 'intervention' | 'pause';

export interface Team {
  id: string;
  name: string;
  color: string;
  pos_x: number;
  pos_y: number;
  status: TeamStatus;
  updated_at: string;
}

export interface MapSettings {
  id: number;
  image_url: string | null;
}
