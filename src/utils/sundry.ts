import { LRUCache } from "./struct/LRUCache";

export function once<T extends (...args: any[]) => any>(
  fn: T
): {
  (...args: Parameters<T>): Promise<ReturnType<T> | undefined>;
  isRunning: () => boolean;
} {
  let isRunning = false;

  const wrappedFn = async function (
    this: any,
    ...args: Parameters<T>
  ): Promise<ReturnType<T> | undefined> {
    if (isRunning) return;
    isRunning = true;
    try {
      return await fn.apply(this, args);
    } finally {
      isRunning = false;
    }
  };

  // 添加获取运行状态的方法
  const result = Object.assign(wrappedFn, {
    isRunning: () => isRunning,
  });

  return result;
}

/**
 * @description 安全的获取是否运行在安全上下文(https)中,在非浏览器环境下会抛出错误，可通过restrain参数控制是否抛出错误
 * @description_en Safely get whether running in a secure context (https), will throw an error in non-browser environments，can control whether to throw an error through the restrain parameter
 * @param [restrain=true] - 是否抑制错误,默认为true
 * @param [restrain=true] - Whether to suppress errors, default is true
 * @returns {boolean}
 */
export function safeIsSecureContext(restrain = true): boolean {
  if (self.isSecureContext !== undefined) {
    return self.isSecureContext;
  }
  // Compatibility with older browsers
  if (self.location) {
    if (self.location.protocol === "https:") {
      return true;
    } else if (self.location.protocol === "http:") {
      return false;
    }
  }
  if (restrain === false) {
    throw new Error(
      `Unable to determine if running in a secure context, if you are running in a Node.js environment, you can ignore this error`
    );
  }
  return false;
}

/**
 * @description 包含随机生成的、长度为 36 字符的第四版 UUID 字符串。
 * @description_en Contains a randomly generated, 36-character, version 4 UUID string.
 */
export function safeRandomUUID() {
  if (typeof self.crypto !== "undefined" && safeIsSecureContext()) {
    if (typeof self.crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof self.crypto.getRandomValues === "function") {
      const buffer = new Uint8Array(16);
      crypto.getRandomValues(buffer);
      // 设置UUID版本（4）和变体（10xx）
      buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
      buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant 10xx
      const hexArr = new Array(16);
      for (let i = 0; i < 16; i++) {
        hexArr[i] = buffer[i].toString(16).padStart(2, "0");
      }
      return (
        hexArr[0] +
        hexArr[1] +
        hexArr[2] +
        hexArr[3] +
        "-" +
        hexArr[4] +
        hexArr[5] +
        "-" +
        hexArr[6] +
        hexArr[7] +
        "-" +
        hexArr[8] +
        hexArr[9] +
        "-" +
        hexArr[10] +
        hexArr[11] +
        hexArr[12] +
        hexArr[13] +
        hexArr[14] +
        hexArr[15]
      );
    }
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const getTextWidth = (() => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("context is null");
  }

  const lruCache = new LRUCache<number>(100);

  const getKey = (text: string, font: string) => {
    const t = `${text}-${font}`;
    return t;
  };

  return (text: string, font: string) => {
    const key = getKey(text, font);
    const cache = lruCache.get(key);
    if (cache) {
      return cache;
    }
    context.font = font;
    const metrics = context.measureText(text);
    const width = Math.round(metrics.width);
    lruCache.set(key, width);
    return width;
  };
})();

export function PromiseWithResolvers<T = void>() {
  let resolve: (value: T) => void = null as unknown as (value: T) => void;
  let reject: (reason?: any) => void = null as unknown as (
    reason?: any
  ) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
