/**
 * OPFS Path Module
 *
 * This module provides path handling functions specifically designed for the Origin Private File System (OPFS).
 * It supports path joining, resolving, normalizing, and extracting directory names, file names, and extensions.
 */

/**
 * Joins multiple path segments into a single path.
 * @param {...string} paths - The path segments to join.
 * @returns {string} The joined path.
 */
export function join(...paths: string[]): string {
  const filteredPaths = paths.filter((p) => p !== "");
  if (filteredPaths.length === 0) return ".";

  let result = "";
  const isAbsolute = filteredPaths[0].startsWith("/");

  filteredPaths.forEach((p, index) => {
    let part = p;
    if (index > 0 && part.startsWith("/")) {
      part = part.slice(1);
    }
    if (index < filteredPaths.length - 1 && part.endsWith("/")) {
      part = part.slice(0, -1);
    }
    result += (index > 0 ? "/" : "") + part;
  });

  if (!isAbsolute && result.startsWith("/")) {
    result = result.slice(1);
  }

  return result || ".";
}

/**
 * Resolves multiple path segments into an absolute path.
 * Assumes the current working directory is the root directory '/'.
 * @param {...string} paths - The path segments to resolve.
 * @returns {string} The resolved absolute path.
 */
export function resolve(...paths: string[]): string {
  let current = "/";
  paths.forEach((p) => {
    if (p.startsWith("/")) {
      current = p;
    } else {
      current = join(current, p);
    }
  });
  return normalize(current);
}

/**
 * Normalizes a path by handling '.' and '..', and removing extra slashes.
 * @param {string} path - The path to normalize.
 * @returns {string} The normalized path.
 */
export function normalize(path: string): string {
  if (path === "") return ".";

  const isAbsolute = path.startsWith("/");
  const trailingSlash = path.endsWith("/") && path !== "/";
  const segments = path
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".");

  const stack: string[] = [];
  segments.forEach((segment) => {
    if (segment === "..") {
      if (stack.length > 0 && stack[stack.length - 1] !== "..") {
        stack.pop();
      } else if (!isAbsolute) {
        stack.push(segment);
      }
    } else {
      stack.push(segment);
    }
  });

  let result = stack.join("/");
  if (isAbsolute) {
    result = "/" + result;
  }
  if (trailingSlash) {
    result += "/";
  }
  return result || (isAbsolute ? "/" : ".");
}

/**
 * Gets the directory name of a path.
 * @param {string} path - The path to process.
 * @returns {string} The directory name.
 */
export function dirname(path: string): string {
  const normalized = normalize(path);
  if (normalized === "/") return "/";
  const lastSlashIndex = normalized.lastIndexOf("/");
  if (lastSlashIndex === -1) return ".";
  if (lastSlashIndex === 0) return "/";
  return normalized.slice(0, lastSlashIndex);
}

/**
 * Gets the base name of a path, optionally removing the extension.
 * @param {string} path - The path to process.
 * @param {string} [ext] - Optional extension to remove.
 * @returns {string} The base name.
 */
export function basename(path: string, ext: string = ""): string {
  const normalized = normalize(path);
  const segments = normalized.split("/");
  const lastSegment = segments[segments.length - 1];
  if (ext && lastSegment.endsWith(ext)) {
    return lastSegment.slice(0, -ext.length);
  }
  return lastSegment;
}

/**
 * Gets the extension of a file path.
 * @param {string} path - The path to process.
 * @returns {string} The file extension.
 * @example
 * // returns '.txt' for 'document.txt'
 * extname('document.txt');
 */
export function extname(path: string): string {
  const base = basename(path);
  const dotIndex = base.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return base.slice(dotIndex);
}

/**
 * Checks if a path is an absolute path.
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is absolute, otherwise false.
 */
export function isAbsolute(path: string): boolean {
  return path.startsWith("/");
}

/**
 * Checks if a path is a relative path.
 * @param {string} path - The path to check.
 * @returns {boolean} True if the path is relative, otherwise false.
 */
export function isRelative(path: string): boolean {
  return !isAbsolute(path);
}

// Default export all functions
export default {
  join,
  resolve,
  normalize,
  dirname,
  basename,
  extname,
  isAbsolute,
  isRelative,
};
