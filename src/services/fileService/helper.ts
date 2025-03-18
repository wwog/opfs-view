import {
  isDirectoryHandle,
  isFileHandle,
  ROOT_DIR,
} from "@happy-js/happy-opfs";
import { dirname, isRelative, normalize, resolve } from "../../utils/opfsPath";
import { pipeToProgress } from "../../utils/stream";
import { asyncIteratorToArray } from "../../utils/sundry";
import {
  decodeSAHPoolFilename,
  HEADER_OFFSET_DATA,
  SAHPoolDirName,
} from "../../utils/sqliteSAHPool";

export async function getDirHandle(
  path: string
): Promise<FileSystemDirectoryHandle> {
  const normalizePath = normalize(path);
  if (isRelative(normalizePath)) {
    throw new Error(`Invalid path: ${path}`);
  }
  const parts = normalizePath.split("/").filter(Boolean);
  let dirHandle = await navigator.storage.getDirectory();
  if (normalizePath === ROOT_DIR) {
    return dirHandle;
  }
  for (const part of parts) {
    dirHandle = await dirHandle.getDirectoryHandle(part, { create: true });
  }

  return dirHandle;
}

export interface SaveHandleOptions {
  onProgress?: (payload: {
    name: string;
    path: string;
    loaded: number;
    percent: number;
    totalSize: number;
  }) => void;
  onUploaded?: (payload: { name: string; path: string }) => void;
  onCompleted?: () => void;
}

export async function saveToOpfs(
  targetDirHandle: FileSystemDirectoryHandle,
  fileHandles: FileSystemHandle[],
  hooks?: SaveHandleOptions
) {
  const parentDirPath = targetDirHandle.name;

  const uploadHandle = async (handle: FileSystemHandle) => {
    if (isFileHandle(handle)) {
      const opfsFileHandle = await targetDirHandle.getFileHandle(handle.name, {
        create: true,
      });
      const writable = await opfsFileHandle.createWritable();

      const path = resolve(parentDirPath, handle.name);
      const file = await handle.getFile();
      await pipeToProgress(file.stream(), writable, file.size, {
        offset: 0,
        onProgress(loaded, percent, totalSize) {
          if (hooks?.onProgress) {
            hooks.onProgress({
              loaded,
              percent,
              name: handle.name,
              path,
              totalSize,
            });
          }
        },
        onDone() {
          if (hooks?.onUploaded) {
            hooks.onUploaded({
              name: handle.name,
              path,
            });
          }
        },
      });
      return;
    }
    if (isDirectoryHandle(handle)) {
      const dirHandle = await targetDirHandle.getDirectoryHandle(handle.name, {
        create: true,
      });
      const handles = await asyncIteratorToArray(handle.values());
      return saveToOpfs(dirHandle, handles, hooks);
    }
  };

  for (const handle of fileHandles) {
    await uploadHandle(handle);
  }

  if (hooks?.onCompleted) {
    hooks.onCompleted();
  }
}

export function byteToReadableStr(byte: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (byte > 1024) {
    byte /= 1024;
    i++;
  }
  const truncated = Math.floor(byte * 100) / 100;
  return `${truncated.toFixed(2)} ${units[i]}`;
}

export async function getOpfsUsage() {
  const { quota = 1, usage = 1 } = await navigator.storage.estimate();

  const percent = Math.floor((usage / quota) * 10000) / 100;

  return {
    quotaStr: byteToReadableStr(quota!),
    usageStr: byteToReadableStr(usage!),
    quota,
    usage,
    percent,
  };
}
export type OpfsUsage = {
  quotaStr: string;
  usageStr: string;
  quota: number;
  usage: number;
  percent: number;
};

export async function saveToDisk(
  targetDirHandle: FileSystemDirectoryHandle,
  items: {
    path: string;
    handle: FileSystemHandle;
  }[],
  hooks?: SaveHandleOptions
) {
  const uploadHandle = async (handle: FileSystemHandle, path: string) => {
    if (isFileHandle(handle)) {
      const dir = dirname(path);
      let filename = handle.name;
      let offset = 0;
      const file = await handle.getFile();
      console.log({
        dir,
        SAHPoolDirName,
        endsWith: dir.endsWith(SAHPoolDirName),
      });
      if (dir.endsWith(SAHPoolDirName)) {
        const SAHName = await decodeSAHPoolFilename(file);
        if (SAHName) {
          filename = SAHName.slice(1);
          offset = HEADER_OFFSET_DATA;
        }
      }
      const opfsFileHandle = await targetDirHandle.getFileHandle(filename, {
        create: true,
      });
      const writable = await opfsFileHandle.createWritable();

      await pipeToProgress(file.stream(), writable, file.size, {
        offset,
        onProgress(loaded, percent, totalSize) {
          if (hooks?.onProgress) {
            hooks.onProgress({
              loaded,
              percent,
              name: handle.name,
              path,
              totalSize,
            });
          }
        },
        onDone() {
          if (hooks?.onUploaded) {
            hooks.onUploaded({
              name: handle.name,
              path,
            });
          }
        },
      });
      return;
    }
    if (isDirectoryHandle(handle)) {
      const dirHandle = await targetDirHandle.getDirectoryHandle(handle.name, {
        create: true,
      });
      const handles = (await asyncIteratorToArray(handle.values())).map(
        (item) => {
          return {
            handle: item,
            path: resolve(path, item.name),
          };
        }
      );
      return saveToDisk(dirHandle, handles, hooks);
    }
  };

  for (const { handle, path } of items) {
    await uploadHandle(handle, path);
  }

  if (hooks?.onCompleted) {
    hooks.onCompleted();
  }
}
