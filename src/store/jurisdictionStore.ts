import { create } from 'zustand';
import type { JurisdictionLevel, CountyDistrict } from '@/types';

interface JurisdictionState {
  level: JurisdictionLevel;
  county: CountyDistrict | '';
  setLevel: (level: JurisdictionLevel) => void;
  setCounty: (county: CountyDistrict | '') => void;
  getFilter: () => { district: CountyDistrict | '' };
}

export const useJurisdictionStore = create<JurisdictionState>((set, get) => ({
  level: 'city',
  county: '',

  setLevel: (level) =>
    set({
      level,
      county: level === 'city' ? '' : get().county || '',
    }),

  setCounty: (county) => set({ county }),

  getFilter: () => {
    const { level, county } = get();
    return { district: level === 'county' ? county : '' };
  },
}));
