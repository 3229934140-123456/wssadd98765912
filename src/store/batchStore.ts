import { create } from 'zustand';
import type { VaccineBatch, BatchFilters } from '@/types';
import { mockBatches } from '@/mock/batches';
import { useJurisdictionStore } from '@/store/jurisdictionStore';
import { useVehicleStore } from '@/store/vehicleStore';

interface BatchState {
  batches: VaccineBatch[];
  filters: BatchFilters;
  selectedBatchId: string | null;
  selectedBatchIds: string[];
  monthlyCheckMode: boolean;
  setSelectedBatch: (id: string | null) => void;
  setSelectedBatchIds: (ids: string[]) => void;
  toggleSelectedBatchId: (id: string) => void;
  setMonthlyCheckMode: (mode: boolean) => void;
  setFilters: (filters: Partial<BatchFilters>) => void;
  resetFilters: () => void;
  getFilteredBatches: () => VaccineBatch[];
  getBatchById: (id: string) => VaccineBatch | undefined;
  getBatchesByVehicleId: (vehicleId: string, batchNumbers: string[]) => VaccineBatch[];
  getBatchesByBatchNumber: (batchNumber: string) => VaccineBatch | undefined;
}

const defaultFilters: BatchFilters = {
  keyword: '',
  vaccineName: '',
  dateRange: null,
  status: '',
};

const filterByJurisdiction = (list: VaccineBatch[]) => {
  const { district } = useJurisdictionStore.getState().getFilter();
  if (!district) return list;
  const { vehicles } = useVehicleStore.getState();
  const districtBatchNumbers = new Set<string>();
  vehicles
    .filter((v) => v.district === district)
    .forEach((v) => v.batchNumbers.forEach((bn) => districtBatchNumbers.add(bn)));
  return list.filter((b) => districtBatchNumbers.has(b.batchNumber));
};

export const useBatchStore = create<BatchState>((set, get) => ({
  batches: mockBatches,
  filters: defaultFilters,
  selectedBatchId: null,
  selectedBatchIds: [],
  monthlyCheckMode: false,

  setSelectedBatch: (id) => set({ selectedBatchId: id }),

  setSelectedBatchIds: (ids) => set({ selectedBatchIds: ids }),

  toggleSelectedBatchId: (id) =>
    set((state) => ({
      selectedBatchIds: state.selectedBatchIds.includes(id)
        ? state.selectedBatchIds.filter((x) => x !== id)
        : [...state.selectedBatchIds, id],
    })),

  setMonthlyCheckMode: (mode) =>
    set((state) => ({ monthlyCheckMode: mode, selectedBatchIds: mode ? [] : state.selectedBatchIds })),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  getFilteredBatches: () => {
    let { batches, filters } = get();
    let list = batches.filter((b) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !b.batchNumber.toLowerCase().includes(kw) &&
          !b.vaccineName.toLowerCase().includes(kw) &&
          !b.manufacturer.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (filters.vaccineName && b.vaccineName !== filters.vaccineName) return false;
      if (filters.status && b.status !== filters.status) return false;
      return true;
    });
    list = filterByJurisdiction(list);
    return list;
  },

  getBatchById: (id) => {
    return get().batches.find((b) => b.id === id);
  },

  getBatchesByVehicleId: (_vehicleId, batchNumbers) => {
    return get().batches.filter((b) => batchNumbers.includes(b.batchNumber));
  },

  getBatchesByBatchNumber: (batchNumber) => {
    return get().batches.find((b) => b.batchNumber === batchNumber);
  },
}));
