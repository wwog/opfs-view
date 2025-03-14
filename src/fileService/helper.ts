import { isFileHandle, ROOT_DIR } from "@happy-js/happy-opfs";
import { isRelative, normalize, resolve } from "../utils/opfsPath";
import { pipeToProgress } from "../utils/stream";

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

export async function upload(
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
    }
  };

  for (const handle of fileHandles) {
    await uploadHandle(handle);
  }

  if (hooks?.onCompleted) {
    hooks.onCompleted();
  }
}
