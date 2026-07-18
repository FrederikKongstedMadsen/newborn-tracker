export type DiaperType = 'pee' | 'poop' | 'both' | 'nothing';

export interface Diaper {
  id: string;
  baby_id: string;
  happened_at: string; // ISO timestamptz
  type: DiaperType;
  note: string | null;
  created_by: string;
  created_at: string;
}

export type NewDiaper = Pick<Diaper, 'baby_id' | 'happened_at' | 'type' | 'note'>;
