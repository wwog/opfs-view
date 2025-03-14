import { useState } from "react";

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [value, _setValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value: T, noChange = false) => {
    localStorage.setItem(key, JSON.stringify(value));
    if (!noChange) {
      _setValue(value);
    }
  };

  return [value, setValue];
};
