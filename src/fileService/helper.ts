import {
  isDirectoryHandle,
  isFileHandle,
  ROOT_DIR,
} from "@happy-js/happy-opfs";
import { isRelative, normalize, resolve } from "../utils/opfsPath";
import { pipeToProgress } from "../utils/stream";
import { asyncIteratorToArray } from "../utils/sundry";

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

export interface UploadHooks {
  onProgress: (payload: {
    name: string;
    path: string;
    loaded: number;
    percent: number;
    totalSize: number;
  }) => void;
  onUploaded: (payload: { name: string; path: string }) => void;
  onCompleted: () => void;
}

export async function saveToDirHandle(
  parentDirHandle: FileSystemDirectoryHandle,
  fileHandles: FileSystemHandle[],
  hooks?: UploadHooks
) {
  const parentDirPath = parentDirHandle.name;

  const uploadHandle = async (handle: FileSystemHandle) => {
    if (isFileHandle(handle)) {
      const opfsFileHandle = await parentDirHandle.getFileHandle(handle.name, {
        create: true,
      });
      const writable = await opfsFileHandle.createWritable();
      const file = await handle.getFile();
      const path = resolve(parentDirPath, handle.name);
      await pipeToProgress(file.stream(), writable, file.size, {
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
      const dirHandle = await parentDirHandle.getDirectoryHandle(handle.name, {
        create: true,
      });
      const handles = await asyncIteratorToArray(handle.values());
      return saveToDirHandle(dirHandle, handles, hooks);
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
