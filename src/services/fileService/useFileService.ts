import { create } from "zustand";
import { FileService } from "./mod";

const creator = (set: any) => {
  const fileService = new FileService();
  fileService.onRefreshChange((isRefreshing) => {
    set({
      isRefreshing,
      currentItems: fileService.currentItems,
      currentPath: fileService.currentPath,
      canGoBack: fileService.canGoBack,
      usage: fileService.usage,
    });
  });

  fileService.refresh();

  return {
    isRefreshing: fileService.isRefreshing,
    currentPath: fileService.currentPath,
    currentItems: fileService.currentItems,
    canGoBack: fileService.canGoBack,
    usage: fileService.usage,
    fileService,
  };
};

export const useFileService = create<ReturnType<typeof creator>>(creator);
