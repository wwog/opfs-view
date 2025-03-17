import { Emitter } from "monaco-editor";
import type { Application, ApplicationInstance } from "./types";
import { extname } from "../../utils/opfsPath";
import { safeRandomUUID } from "../../utils/sundry";

export class ApplicationService {
  private static instance: ApplicationService;
  static getInstance(): ApplicationService {
    if (!ApplicationService.instance) {
      ApplicationService.instance = new ApplicationService();
    }
    return ApplicationService.instance;
  }

  private _onActiveChange = new Emitter<ApplicationInstance | undefined>();
  private _onAppClose = new Emitter<ApplicationInstance[]>();
  private _onAppOpen = new Emitter<ApplicationInstance>();
  onActiveChange = this._onActiveChange.event;
  onAppClose = this._onAppClose.event;
  onAppOpen = this._onAppOpen.event;

  registerApps: Application[] = [];
  openApps: ApplicationInstance[] = [];
  activeApp: ApplicationInstance | undefined;

  private constructor() {
    this.onActiveChange((instance) => {
      if (this.activeApp) {
        this.activeApp.active = false;
      }
      if (instance) {
        instance.active = true;
      }
      this.activeApp = instance;
    });
  }

  findApp(id: string) {
    return this.registerApps.find((app) => app.id === id);
  }

  registerApplication(app: Application) {
    if (this.findApp(app.id) === undefined) {
      this.registerApps.push(app);
    }
  }

  getApplicationsByFileType(fileType: string) {
    return this.registerApps.filter((app) =>
      app.supportedFileTypes.includes(fileType)
    );
  }

  isOpen(filepath: string, appId: string) {
    return this.openApps.find(
      (app) => app.id === appId && app.filePath === filepath
    );
  }

  openFile(filepath: string, appId?: string) {
    const fileExt = extname(filepath);

    if (appId === undefined) {
      const apps = this.getApplicationsByFileType(fileExt);
      if (apps.length === 0) {
        return false;
      }
      appId = apps[0].id;
    }
    const existing = this.isOpen(filepath, appId);
    if (existing) {
      this._onActiveChange.fire(existing);
      return existing;
    }
    const app = this.findApp(appId);
    if (app === undefined) {
      throw new Error(`Application with ID ${appId} not found`);
    }
    const instance: ApplicationInstance = {
      id: safeRandomUUID(),
      appId: app.id,
      filePath: filepath,
      active: true,
    };
    this.openApps.push(instance);
    this._onActiveChange.fire(instance);
    this._onAppOpen.fire(instance);
    return instance;
  }

  closeApp(insId: string) {
    const index = this.openApps.findIndex((app) => app.id === insId);
    const closeInstance = this.openApps[index];
    if (index !== -1) {
      this.openApps.splice(index, 1);
      if (this.activeApp?.id === insId) {
        this._onActiveChange.fire(undefined);
      }
      this._onAppClose.fire([closeInstance]); // Use closeInstance instead of this.openApps[index]
    } else {
      throw new Error(`Instance with ID ${insId} not found`);
    }
  }

  closeAllApp() {
    this._onAppClose.fire(this.openApps);
    this.openApps = [];
    this._onActiveChange.fire(undefined);
  }

  changeActiveApp(insId: string) {
    const instance = this.openApps.find((app) => app.id === insId);
    if (instance) {
      this._onActiveChange.fire(instance);
    } else {
      throw new Error(`Instance with ID ${insId} not found`);
    }
  }
}
