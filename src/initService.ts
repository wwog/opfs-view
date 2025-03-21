import { monacoApplication } from "./applications/monaco";
import { ApplicationService } from "./services/appService/mod";

export const initService = () => {
  const appService = ApplicationService.getInstance();
  appService.registerApplication(monacoApplication);
  console.log("Application service initialized");
};
