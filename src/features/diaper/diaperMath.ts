import { localDateIso } from '@/lib/dates';

import type { Diaper } from './types';

/** Counts diapers whose local calendar date matches todayIsoStr. */
export function todayCount(diapers: Diaper[], todayIsoStr: string): number {
  return diapers.filter((d) => localDateIso(d.happened_at) === todayIsoStr).length;
}
