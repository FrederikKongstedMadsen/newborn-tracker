export interface Baby {
  id: string;
  name: string;
  sex: 'male' | 'female';
  birth_date: string; // 'YYYY-MM-DD'
  created_by: string;
  created_at: string;
}

export type NewBaby = Pick<Baby, 'name' | 'sex' | 'birth_date'>;
