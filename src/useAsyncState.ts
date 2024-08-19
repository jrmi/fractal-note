import { useState, useRef, useEffect, useCallback } from 'preact/hooks';

function useStateWithPromise(initialValue) {
  const [state, setState] = useState(initialValue);
  const resolveRef = useRef(null);

  useEffect(() => {
    if (resolveRef.current) {
      resolveRef.current(state);
      resolveRef.current = null;
    }
  }, [state]);

  const setStateWithPromise = useCallback((newValue) => {
    let promise;

    if (resolveRef.current) {
      promise = resolveRef.current;
    } else {
      promise = new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    }

    setState(newValue);
    return promise;
  }, []);

  return [state, setStateWithPromise];
}

export default useStateWithPromise;
