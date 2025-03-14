import { LinkedList } from "./LinkedList";

export type CacheElement<T> = {
  key: string;
  value: T;
};

export class LRUCache<T> {
  static MinSize = 50;

  static fromArray<T>(array: CacheElement<T>[], maxSize = LRUCache.MinSize) {
    const cache = new LRUCache<T>(maxSize);
    array.forEach((element) => {
      cache.set(element.key, element.value);
    });
    return cache;
  }

  private cache = new LinkedList<CacheElement<T>>();
  private maxSize: number;

  constructor(maxSize = LRUCache.MinSize) {
    if (maxSize <= 0) {
      throw new Error("maxSize must be greater than 0");
    }
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined;
  get(predicate: (element: CacheElement<T>) => boolean): T | undefined;
  get(
    keyOrPredicate: string | ((element: CacheElement<T>) => boolean)
  ): T | undefined {
    const node = this.cache.find((element) => {
      return typeof keyOrPredicate === "function"
        ? keyOrPredicate(element)
        : element.key === keyOrPredicate;
    });
    if (node) {
      const element = node.element;
      this.cache.removeNode(node);
      this.cache.unshift(element);
      return element.value;
    }
    return undefined;
  }

  set(key: string, value: T) {
    const element = {
      key,
      value,
    };
    const node = this.cache.find((item) => item.key === key);
    if (node) {
      this.cache.unshift(element);
      this.cache.removeNode(node);
    } else {
      this.cache.push(element);
    }

    while (this.cache.len > this.maxSize) {
      this.cache.pop();
    }
  }

  clear() {
    this.cache.clear();
  }

  print() {
    console.log(`[LRUCache Print:${new Date().getUTCDate()}]`, this.cache);
  }
}
