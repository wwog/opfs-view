import {
  ROOT_DIR,
  exists,
  isFileHandle,
  mkdir,
  readDir,
  remove,
  stat,
  writeFile,
} from "@happy-js/happy-opfs";
import { once } from "../../utils/sundry";
import { extname, normalize, resolve } from "../../utils/opfsPath";
import { Emitter } from "monaco-editor";
import {
  getDirHandle,
  getOpfsUsage,
  saveToDisk,
  saveToOpfs,
  type OpfsUsage,
} from "./helper";
import {
  decodeSAHPoolFilename,
  SAHPoolDirName,
} from "../../utils/sqliteSAHPool";

function checkPathValidity(path: string) {
  const isValid = path.startsWith(ROOT_DIR);
  if (isValid === false) {
    throw new Error(`Invalid path: ${path}`);
  }
}

export interface FileSystemItem {
  name: string;
  path: string;
  kind: "directory" | "file" | "dbFile";
  handle: FileSystemHandle;
  url?: string;
  subname?: string;
}

export class FileService {
  private static instance: FileService;
  static getInstance(): FileService {
    if (!FileService.instance) {
      FileService.instance = new FileService();
    }
    return FileService.instance;
  }

  private _currentPath: string = ROOT_DIR;
  private _onRefreshChange = new Emitter<boolean>();
  static ImageExt = [".png", ".jpg", "jpeg"];
  onRefreshChange = this._onRefreshChange.event;

  currentItems: FileSystemItem[] = [];
  usage: OpfsUsage = {
    usage: 0,
    percent: 0,
    quota: 0,
    quotaStr: "0",
    usageStr: "0",
  };

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

  private constructor() {
    console.log("FileService constructor");
  }

  private handleSpecialFile = async (item: FileSystemItem, dirname: string) => {
    if (isFileHandle(item.handle)) {
      const ext = extname(item.name);
      if (FileService.ImageExt.includes(ext)) {
        item.url = URL.createObjectURL(await item.handle.getFile());
        return;
      }
      if (dirname.endsWith(SAHPoolDirName)) {
        const file = await item.handle.getFile();
        const filename = await decodeSAHPoolFilename(file);
        if (filename) {
          item.kind = "dbFile";
          item.subname = filename;
        }
        return;
      }
    }
  };

  refresh = once(async () => {
    this._onRefreshChange.fire(true);
    const currentPath = this.currentPath;
    const res = await readDir(currentPath);
    const reader = res.unwrap();
    const items: FileSystemItem[] = [];
    for await (const element of reader) {
      const item: FileSystemItem = {
        name: element.handle.name,
        path: resolve(currentPath, element.handle.name),
        kind: element.handle.kind,
        handle: element.handle,
      };
      await this.handleSpecialFile(item, currentPath);
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

    const usage = await getOpfsUsage();
    this.usage = usage;
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

  save = async (handles: FileSystemHandle[]) => {
    const parentDirHandle = await getDirHandle(this.currentPath);
    await saveToOpfs(parentDirHandle, handles);
    await this.refresh();
  };

  remove = async (paths: string[]) => {
    const promises = paths.map((path) => {
      return remove(path);
    });
    await Promise.all(promises);
    await this.refresh();
  };

  saveToDisk = async (paths: string[]) => {
    const items = await Promise.all(
      paths.map(async (path) => {
        const res = await stat(path);
        return {
          handle: res.unwrap(),
          path,
        };
      })
    );

    const diskHandle: FileSystemDirectoryHandle =
      //@ts-expect-error saveHandle
      await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "downloads",
      });

    await saveToDisk(diskHandle, items);
  };

  createFile = async (name: string) => {
    const newPath = resolve(this.currentPath, name);
    checkPathValidity(newPath);
    const existed = (await exists(newPath)).unwrap();
    if (!existed) {
      await writeFile(newPath, new Blob(), {
        create: true,
      });
      await this.refresh();
    } else {
      throw new Error("File already exists");
    }
  };
}
