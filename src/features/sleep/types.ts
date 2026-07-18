export interface Sleep {
  id: string;
  baby_id: string;
  started_at: string; // ISO timestamptz
  ended_at: string | null; // null = running
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface SleepPause {
  id: string;
  sleep_id: string;
  started_at: string;
  ended_at: string | null; // null = currently paused
  created_at: string;
}

export interface SleepWithPauses extends Sleep {
  sleep_pauses: SleepPause[];
}
