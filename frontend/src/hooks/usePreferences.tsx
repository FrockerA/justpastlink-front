import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'justpastlink.preferences';

export interface UserPreferences {
  notificationsEnabled: boolean;
  autoOpenResults: boolean;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  setPreference: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => void;
}

const defaultPreferences: UserPreferences = {
  notificationsEnabled: true,
  autoOpenResults: false,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function readPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultPreferences;
    }

    return {
      ...defaultPreferences,
      ...JSON.parse(stored),
    };
  } catch {
    return defaultPreferences;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(readPreferences);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setPreference = useCallback(
    <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => {
      setPreferences((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const value = useMemo(
    () => ({
      preferences,
      setPreference,
    }),
    [preferences, setPreference]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
