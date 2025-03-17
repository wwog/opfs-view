import type { ComponentType, ReactNode } from "react";

export interface ApplicationProps {
  filePath: string;
}

export interface Application {
  id: string;
  name: string;
  icon: ReactNode;
  supportedFileTypes: string[];
  component: ComponentType<ApplicationProps>;
}

export interface ApplicationInstance {
  id: string;
  appId: string;
  filePath: string;
  active: boolean;
}
