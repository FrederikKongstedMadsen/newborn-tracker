export interface Temperature {
  id: string;
  baby_id: string;
  measured_at: string; // ISO timestamptz
  celsius: number;
  note: string | null;
  created_by: string;
  created_at: string;
}

export type NewTemperature = Pick<Temperature, 'baby_id' | 'measured_at' | 'celsius' | 'note'>;

export interface MedicineDose {
  id: string;
  baby_id: string;
  given_at: string; // ISO timestamptz
  medicine: string;
  amount: number;
  unit: 'ml' | 'mg';
  note: string | null;
  created_by: string;
  created_at: string;
}

export type NewMedicineDose = Pick<
  MedicineDose,
  'baby_id' | 'given_at' | 'medicine' | 'amount' | 'unit' | 'note'
>;
