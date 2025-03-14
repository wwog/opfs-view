import { create } from "zustand";

const creator = (set: any) => {
  return {
    selectItems: [] as Element[],
    setSelectItems: (items: Element[]) => {
      set({ selectItems: items });
    },
  };
};

export const useOpfsViewerStore = create(creator);
