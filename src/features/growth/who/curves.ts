import type { Indicator, WhoCurve } from './types';

import headFemale from './data/head-circumference-for-age-female.json';
import headMale from './data/head-circumference-for-age-male.json';
import lengthFemale from './data/length-for-age-female.json';
import lengthMale from './data/length-for-age-male.json';
import weightFemale from './data/weight-for-age-female.json';
import weightMale from './data/weight-for-age-male.json';

const curves: Record<Indicator, Record<'male' | 'female', WhoCurve>> = {
  'weight-for-age': { male: weightMale as WhoCurve, female: weightFemale as WhoCurve },
  'length-for-age': { male: lengthMale as WhoCurve, female: lengthFemale as WhoCurve },
  'head-circumference-for-age': { male: headMale as WhoCurve, female: headFemale as WhoCurve },
};

export function getCurve(indicator: Indicator, sex: 'male' | 'female'): WhoCurve {
  return curves[indicator][sex];
}
