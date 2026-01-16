// ------------------ Utility path matcher ------------------

/**
 * Performs match operation.
 * @param {string} path - Description of path
 * @param {string} pattern - Description of pattern
 * @returns {Record<string, string>} Description of return value
 */
export function match(path: string, pattern: string) {
  const keys: string[] = [];
  const regexStr =
    "^" +
    pattern.replace(/:[^/]+/g, (m) => {
      keys.push(m.slice(1));
      return "([^/]+)";
    }) +
    "$";

  const m = path.match(new RegExp(regexStr));
  if (!m) return null;

  const params: Record<string, string> = {};
  keys.forEach((k, i) => (params[k] = m[i + 1] ?? ""));
  return params;
}
