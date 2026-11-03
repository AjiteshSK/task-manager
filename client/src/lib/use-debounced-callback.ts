import { useEffect, useRef } from 'react';

/**
 * Returns a version of `callback` that runs only after `delayMs` without another call.
 * Used for search, so the list is fetched when the user pauses typing, not on every key.
 */
export function useDebouncedCallback<T>(callback: (value: T) => void, delayMs: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Drop a pending call if the component unmounts
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (value: T) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(value), delayMs);
  };
}
