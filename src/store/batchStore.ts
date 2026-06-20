import { create } from 'zustand';
import type { VaccineBatch, BatchFilters } from '@/types';
import { mockBatches } from '@/mock/batches';

interface BatchState {
  batches: VaccineBatch[];
  filters: BatchFilters;
  selectedBatchId: string | null;
  setSelectedBatch: (id: string | null) => void;
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

export const useBatchStore = create<BatchState>((set, get) => ({
  batches: mockBatches,
  filters: defaultFilters,
  selectedBatchId: null,

  setSelectedBatch: (id) => set({ selectedBatchId: id }),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: defaultFilters }),

  getFilteredBatches: () => {
    const { batches, filters } = get();
    return batches.filter((b) => {
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
