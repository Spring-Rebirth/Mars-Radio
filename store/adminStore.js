import { create } from "zustand";

export const useAdminStore = create((set) => ({
  adminList: [],
  setAdminList: (list) => set({ adminList: list }),
}));