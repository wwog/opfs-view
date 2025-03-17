import { create } from "zustand";
import { ApplicationService } from "./mod";

const creator = (set: any) => {
  const appService = ApplicationService.getInstance();

  appService.onActiveChange((instance) => {
    set({ active: instance });
  });

  appService.onAppOpen(() => {
    set({ opened: appService.openApps });
  });

  appService.onAppClose(() => {
    set({ opened: appService.openApps });
  });

  return {
    appService,
    active: appService.activeApp,
    opened: appService.openApps,
  };
};

export const useAppService = create(creator);
