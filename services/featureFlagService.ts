import { useEffect, useState } from 'react';
import { api } from './api';
import { applyI18nFeatureFlag } from '../i18n';

export interface AppFeatureFlags {
  i18nEnabled: boolean;
}

let cachedFlags: AppFeatureFlags = { i18nEnabled: false };
let flagsLoaded = false;
let inFlight: Promise<AppFeatureFlags> | null = null;
const listeners = new Set<(flags: AppFeatureFlags) => void>();

function notifyAll() {
  listeners.forEach((cb) => cb(cachedFlags));
}

export async function loadFeatureFlags(force = false): Promise<AppFeatureFlags> {
  if (flagsLoaded && !force) return cachedFlags;
  if (inFlight && !force) return inFlight;

  inFlight = api
    .get<AppFeatureFlags>('/plans/features')
    .then((res) => {
      cachedFlags = { i18nEnabled: Boolean(res?.i18nEnabled) };
      flagsLoaded = true;
      void applyI18nFeatureFlag(cachedFlags.i18nEnabled);
      notifyAll();
      return cachedFlags;
    })
    .catch(() => {
      cachedFlags = { i18nEnabled: false };
      flagsLoaded = true;
      void applyI18nFeatureFlag(false);
      notifyAll();
      return cachedFlags;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function getCachedFeatureFlags(): AppFeatureFlags {
  return cachedFlags;
}

export function useFeatureFlags(): AppFeatureFlags {
  const [flags, setFlags] = useState<AppFeatureFlags>(cachedFlags);

  useEffect(() => {
    listeners.add(setFlags);
    void loadFeatureFlags();
    return () => {
      listeners.delete(setFlags);
    };
  }, []);

  return flags;
}
