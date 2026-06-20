import { create } from 'zustand';
import type { Vehicle, TrackPoint, VehicleFilters, JurisdictionLevel, CountyDistrict } from '@/types';
import { mockVehicles, mockTrackPoints } from '@/mock/vehicles';

interface VehicleState {
  vehicles: Vehicle[];
  trackPoints: Record<string, TrackPoint[]>;
  selectedVehicleId: string | null;
  filters: VehicleFilters;
  jurisdiction: JurisdictionLevel;
  countyDistrict: CountyDistrict | '';
  highlightTrackSegment: { vehicleId: string; pointIds: string[] } | null;
  setSelectedVehicle: (id: string | null) => void;
  setFilters: (filters: Partial<VehicleFilters>) => void;
  resetFilters: () => void;
  setJurisdiction: (level: JurisdictionLevel) => void;
  setCountyDistrict: (district: CountyDistrict | '') => void;
  setHighlightTrackSegment: (segment: { vehicleId: string; pointIds: string[] } | null) => void;
  getFilteredVehicles: () => Vehicle[];
  getTrackPointsByVehicleId: (id: string) => TrackPoint[];
  getVehicleStats: () => {
    total: number;
    inTransit: number;
    normal: number;
    abnormal: number;
    todayDeliveries: number;
  };
}

const defaultFilters: VehicleFilters = {
  route: '',
  carrier: '',
  vaccineType: '',
  status: '',
};

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: mockVehicles,
  trackPoints: mockTrackPoints,
  selectedVehicleId: null,
  filters: defaultFilters,
  jurisdiction: 'city',
  countyDistrict: '',
  highlightTrackSegment: null,

  setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  setJurisdiction: (level) => set({
    jurisdiction: level,
    countyDistrict: level === 'city' ? '' : get().countyDistrict || '',
  }),

  setCountyDistrict: (district) => set({ countyDistrict: district }),

  setHighlightTrackSegment: (segment) => set({ highlightTrackSegment: segment }),

  getFilteredVehicles: () => {
    const { vehicles, filters, jurisdiction, countyDistrict } = get();
    return vehicles.filter((v) => {
      if (jurisdiction === 'county' && countyDistrict && v.district !== countyDistrict) return false;
      if (filters.route && v.route !== filters.route) return false;
      if (filters.carrier && v.carrier !== filters.carrier) return false;
      if (filters.vaccineType && v.vaccineType !== filters.vaccineType) return false;
      if (filters.status && v.status !== filters.status) return false;
      return true;
    });
  },

  getTrackPointsByVehicleId: (id) => {
    return get().trackPoints[id] || [];
  },

  getVehicleStats: () => {
    const filtered = get().getFilteredVehicles();
    const total = filtered.length;
    const inTransit = filtered.filter((v) => v.status === 'in-transit').length;
    const normal = filtered.filter((v) => v.currentTemp >= 2 && v.currentTemp <= 8).length;
    const abnormal = total - normal;
    const todayDeliveries = filtered.length;
    return { total, inTransit, normal, abnormal, todayDeliveries };
  },
}));
