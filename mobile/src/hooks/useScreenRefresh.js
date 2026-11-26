import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export default function useScreenRefresh(load) {
  const focused = useIsFocused();
  const latest = useRef(load);
  latest.current = load;
  useEffect(() => {
    if (!focused) return;
    latest.current();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') latest.current();
    });
    const timer = setInterval(() => { if (AppState.currentState === 'active') latest.current(); }, 60000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [focused]);
}
