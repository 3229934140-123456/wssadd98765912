import { create } from 'zustand';
import type { Vehicle, TrackPoint, VehicleFilters } from '@/types';
import { mockVehicles, mockTrackPoints } from '@/mock/vehicles';

interface VehicleState {
  vehicles: Vehicle[];
  trackPoints: Record<string, TrackPoint[]>;
  selectedVehicleId: string | null;
  filters: VehicleFilters;
  setSelectedVehicle: (id: string | null) => void;
  setFilters: (filters: Partial<VehicleFilters>) => void;
  resetFilters: () => void;
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

  setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  getFilteredVehicles: () => {
    const { vehicles, filters } = get();
    return vehicles.filter((v) => {
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
    const { vehicles } = get();
    const total = vehicles.length;
    const inTransit = vehicles.filter((v) => v.status === 'in-transit').length;
    const normal = vehicles.filter((v) => v.currentTemp >= 2 && v.currentTemp <= 8).length;
    const abnormal = total - normal;
    const todayDeliveries = vehicles.length;
    return { total, inTransit, normal, abnormal, todayDeliveries };
  },
}));
