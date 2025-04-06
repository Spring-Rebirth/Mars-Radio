import { create } from "zustand";

interface FocusStatusStore {
    homeActiveTabIndex: number;
    setHomeActiveTabIndex: (index: number) => void;

    profileActiveTabIndex: number;
    setProfileActiveTabIndex: (index: number) => void;
}

const useFocusStatusStore = create<FocusStatusStore>((set) => ({
    homeActiveTabIndex: 0,
    setHomeActiveTabIndex: (index: number) => set({ homeActiveTabIndex: index }),

    profileActiveTabIndex: 0,
    setProfileActiveTabIndex: (index: number) => set({ profileActiveTabIndex: index }),
}));

export default useFocusStatusStore;