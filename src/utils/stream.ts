import { PromiseWithResolvers } from "./sundry";

export interface PipeToOptions {
  offset?: number;
  length?: number;
  onChunk?: (chunk: Uint8Array) => void;
  onDone?: () => void;
  onError?: (err: any) => void;
}

export async function pipeTo(
  readableStream: ReadableStream<Uint8Array>,
  writableStream: WritableStream<Uint8Array>,
  options: PipeToOptions
) {
  const { offset = 0, length } = options;
  const reader = readableStream.getReader();
  const writer = writableStream.getWriter();
  const resResolver = PromiseWithResolvers<void>();

  let remainingOffset = offset;
  let remainingLength = length;
  let shouldStop = false;

  const cleanup = async (err?: any) => {
    try {
      await reader.cancel(); // Cancel the reader to stop further reads
      await writer.close(); // Close the writer to signal completion
    } catch (cleanupErr) {
      console.error("Error during cleanup:", cleanupErr);
    } finally {
      reader.releaseLock();
      writer.releaseLock();

      if (err) {
        options.onError?.(err);
        resResolver.reject(err);
      } else {
        options.onDone?.();
        resResolver.resolve();
      }
    }
  };

  const applyOffsetAndLength = (chunk: Uint8Array): Uint8Array | null => {
    // Handle offset
    if (remainingOffset > 0) {
      if (chunk.length <= remainingOffset) {
        remainingOffset -= chunk.length;
        return null; // Skip this chunk entirely
      }
      chunk = chunk.subarray(remainingOffset);
      remainingOffset = 0;
    }

    // Handle length
    if (remainingLength !== undefined) {
      if (remainingLength <= 0) {
        return null; // Stop processing further chunks
      }
      if (chunk.length > remainingLength) {
        chunk = chunk.subarray(0, remainingLength);
        remainingLength = 0;
      } else {
        remainingLength -= chunk.length;
      }
    }

    return chunk;
  };

  const pump = async () => {
    while (!shouldStop) {
      const { done, value } = await reader.read();

      if (done) {
        shouldStop = true;
        break;
      }

      if (!value) {
        continue; // Skip empty chunks
      }

      const processedChunk = applyOffsetAndLength(value);
      if (!processedChunk) {
        if (remainingLength !== undefined && remainingLength <= 0) {
          shouldStop = true;
          break;
        }
        continue;
      }

      await writer.write(processedChunk);
      options.onChunk?.(processedChunk);
    }

    await cleanup(
      shouldStop && remainingLength !== undefined && remainingLength > 0
        ? new Error("Stream stopped prematurely")
        : undefined
    );
  };

  pump().catch((err) => cleanup(err));
  return resResolver.promise;
}

export interface PipeToProgressOptions extends PipeToOptions {
  onProgress?: (loaded: number, percent: number, totalSize: number) => void;
}

export async function pipeToProgress(
  readableStream: ReadableStream<Uint8Array>,
  writableStream: WritableStream<Uint8Array>,
  totalSize: number,
  hooks: PipeToProgressOptions
) {
  let loaded = 0;

  return pipeTo(readableStream, writableStream, {
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

export async function* streamToAsyncIterator<T extends ArrayBufferLike>(
  stream: ReadableStream<T>
): AsyncIterableIterator<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
