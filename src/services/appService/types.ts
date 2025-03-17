import type { ComponentType, ReactNode } from "react";

export interface ApplicationProps {
  filePath: string;
  extName: string;
}

export interface Application {
  id: string;
  name: string;
  showName?: (name: string, path: string) => string;
  icon: ReactNode;
  supportedFileTypes: string[];
  component: ComponentType<ApplicationProps>;
}

export interface ApplicationInstance {
  id: string;
  showName: string;
  appId: string;
  filePath: string;
  extName: string;
  active: boolean;
}
