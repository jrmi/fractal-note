import { useCallback, useState, useEffect } from 'preact/hooks';

const getFromLocalStorage = (key, defaultValue) => {
  const item = window.localStorage.getItem(key);
  if (item === null) {
    window.localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(item);
};

const useLocalStorage = (key, initialValue) => {
  const [prevKey, setPrevkey] = useState(key);
  const [storedValue, setStoredValue] = useState(() =>
    getFromLocalStorage(key, initialValue)
  );

  useEffect(() => {
    setPrevkey(key);
  }, [key, prevKey]);

  useEffect(() => {
    if (key !== prevKey) {
      setStoredValue(getFromLocalStorage(key, initialValue));
    }
  }, [key, prevKey, initialValue]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback(
    (value) => {
      try {
        // Save state
        setStoredValue((prev) => {
          // Allow value to be a function so we have same API as useState
          const valueToStore = value instanceof Function ? value(prev) : value;

          // Save to local storage
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error);
      }
    },
    [key]
  );

  // React on other tab modifications
  useEffect(() => {
    const localStorageChanged = (e) => {
      if (e.key === key) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', localStorageChanged);
    return () => {
      window.removeEventListener('storage', localStorageChanged);
    };
  }, [key, setStoredValue]);

  return [storedValue, setValue];
};

export default useLocalStorage;
