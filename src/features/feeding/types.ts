export type FeedSide = 'left' | 'right';

export interface Feed {
  id: string;
  baby_id: string;
  type: 'breast' | 'formula';
  started_at: string; // ISO timestamptz
  ended_at: string | null; // null = running
  left_seconds: number;
  right_seconds: number;
  volume_ml: number | null;
  active_side: FeedSide | null;
  active_side_started_at: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface NewFormulaFeed {
  baby_id: string;
  at: string; // ISO — becomes started_at AND ended_at
  volume_ml: number;
  note: string | null;
}
