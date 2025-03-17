import { useEffect, useRef } from "react";

export function useOnce(callback: () => void, dep: any[] = []) {
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dep);
}
