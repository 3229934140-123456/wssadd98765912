import { create } from 'zustand';
import type { Vehicle, TrackPoint, VehicleFilters, CountyDistrict } from '@/types';
import { mockVehicles, mockTrackPoints } from '@/mock/vehicles';
import { useJurisdictionStore } from '@/store/jurisdictionStore';

interface VehicleState {
  vehicles: Vehicle[];
  trackPoints: Record<string, TrackPoint[]>;
  selectedVehicleId: string | null;
  filters: VehicleFilters;
  highlightTrackSegment: { vehicleId: string; pointIds: string[] } | null;
  activeExceptionId: string | null;
  setSelectedVehicle: (id: string | null) => void;
  setFilters: (filters: Partial<VehicleFilters>) => void;
  resetFilters: () => void;
  setHighlightTrackSegment: (segment: { vehicleId: string; pointIds: string[] } | null) => void;
  setActiveExceptionId: (id: string | null) => void;
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
  highlightTrackSegment: null,
  activeExceptionId: null,

  setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  setHighlightTrackSegment: (segment) => set({ highlightTrackSegment: segment }),

  setActiveExceptionId: (id) => set({ activeExceptionId: id }),

  getFilteredVehicles: () => {
    const { vehicles, filters } = get();
    const { district } = useJurisdictionStore.getState().getFilter();
    return vehicles.filter((v) => {
      if (district && v.district !== district) return false;
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
