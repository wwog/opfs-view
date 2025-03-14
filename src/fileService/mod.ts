import {
  ROOT_DIR,
  isFileHandle,
  mkdir,
  readDir,
} from "@happy-js/happy-opfs";
import { once } from "../utils/sundry";
import { extname, normalize, resolve } from "../utils/opfsPath";
import { Emitter } from "monaco-editor";
import { getDirHandle, upload } from "./helper";

function checkPathValidity(path: string) {
  const isValid = path.startsWith(ROOT_DIR);
  if (isValid === false) {
    throw new Error(`Invalid path: ${path}`);
  }
}

export interface FileSystemItem {
  name: string;
  path: string;
  kind: "directory" | "file";
  handle: FileSystemHandle;
  url?: string;
}

export class FileService {
  private _currentPath: string = ROOT_DIR;
  private _onRefreshChange = new Emitter<boolean>();
  onRefreshChange = this._onRefreshChange.event;

  currentItems: FileSystemItem[] = [];

  get currentPath() {
    return this._currentPath;
  }

  set currentPath(path: string) {
    this._currentPath = normalize(path);
  }

  get isRefreshing() {
    return this.refresh.isRunning();
  }

  get canGoBack() {
    return this.currentPath !== ROOT_DIR;
  }

  constructor() {
    console.log("FileService constructor");
  }

  refresh = once(async () => {
    this._onRefreshChange.fire(true);
    const res = await readDir(this.currentPath);
    const reader = res.unwrap();
    const items: FileSystemItem[] = [];
    for await (const element of reader) {
      const item: FileSystemItem = {
        name: element.handle.name,
        path: resolve(this.currentPath, element.handle.name),
        kind: element.handle.kind,
        handle: element.handle,
      };
      if ([".png", ".jpg", "jpeg"].includes(extname(item.name))) {
        if (isFileHandle(element.handle)) {
          item.url = URL.createObjectURL(await element.handle.getFile());
        }
      }
      items.push(item);
    }

    items.sort((a, b) => {
      if (a.handle.kind === "directory" && b.handle.kind === "file") {
        return -1;
      }
      if (a.handle.kind === "file" && b.handle.kind === "directory") {
        return 1;
      }
      return a.handle.name.localeCompare(b.handle.name);
    });

    this.currentItems = items;
    this._onRefreshChange.fire(false);
    return items;
  });

  /**
   * @description Jump relative to the current path
   */
  jumpRelative = async (path: string) => {
    const newPath = resolve(this.currentPath, path);
    checkPathValidity(newPath);
    this.currentPath = newPath;
    await this.refresh();
  };

  /**
   * @description Jump to the specified path
   */
  jumpAbsolute = async (path: string) => {
    checkPathValidity(path);
    this.currentPath = path;
    await this.refresh();
  };

  mkdir = async (name: string) => {
    const newPath = resolve(this.currentPath, name);
    checkPathValidity(newPath);
    await mkdir(newPath);
    await this.refresh();
  };

  upload = async (handles: FileSystemHandle[]) => {
    console.log("upload", handles);
    const parentDirHandle = await getDirHandle(this.currentPath);
    return upload(parentDirHandle, handles);
  };
}
