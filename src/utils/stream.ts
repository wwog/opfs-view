import { PromiseWithResolvers } from "./sundry";

export interface PipeToHooks {
  onChunk?: (chunk: Uint8Array) => void;
  onDone?: () => void;
  onError?: (err: any) => void;
}

export async function pipeTo(
  readableStream: ReadableStream<Uint8Array>,
  writeableStream: WritableStream<Uint8Array>,
  hooks: PipeToHooks
) {
  const reader = readableStream.getReader();
  const writer = writeableStream.getWriter();
  const resResolver = PromiseWithResolvers<void>();

  const pump = () =>
    reader
      .read()
      .then(({ done, value }) => {
        if (done) {
          writer.close();
          reader.releaseLock();
          writer.releaseLock();
          hooks.onDone?.();
          resResolver.resolve();
          return;
        }
        writer.write(value).then(() => {
          hooks.onChunk?.(value);
          pump();
        });
      })
      .catch((err) => {
        writer.abort();
        reader.cancel();
        reader.releaseLock();
        writer.releaseLock();
        hooks.onError?.(err);
        resResolver.reject(err);
      });
  pump();
  return resResolver.promise;
}

export interface PipeToProgressHooks extends PipeToHooks {
  onProgress?: (loaded: number, percent: number, totalSize: number) => void;
}

export async function pipeToProgress(
  readableStream: ReadableStream<Uint8Array>,
  writeableStream: WritableStream<Uint8Array>,
  totalSize: number,
  hooks: PipeToProgressHooks
) {
  let loaded = 0;

  return pipeTo(readableStream, writeableStream, {
    onChunk(chunk) {
      loaded += chunk.length;
      const percent = parseFloat(((loaded / totalSize) * 100).toFixed(2));
      hooks.onProgress?.(loaded, percent, totalSize);
      hooks.onChunk?.(chunk);
    },
    onDone() {
      hooks.onDone?.();
    },
  });
}
