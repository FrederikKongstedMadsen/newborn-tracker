export interface Note {
  id: string;
  baby_id: string;
  noted_at: string; // ISO timestamptz
  body: string;
  created_by: string;
  created_at: string;
}

export type NewNote = Pick<Note, 'baby_id' | 'noted_at' | 'body'>;
