import { useEffect, useState } from "react";

/**
 * Simple debounced value hook.
 * Returns a value that updates only after `delay` ms have passed since the last change.
 */
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
