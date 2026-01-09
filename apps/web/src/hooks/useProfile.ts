import { useState, useEffect, useCallback } from 'react';
import type { Profile } from '../types';
import defaultProfilesData from '../data/default_profiles.json';

const STORAGE_KEY = 'stt-console-profiles';
const ACTIVE_PROFILE_KEY = 'stt-console-active-profile';

interface UseProfileReturn {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (id: string, profile: Profile) => void;
  deleteProfile: (id: string) => void;
  resetToDefaults: () => void;
  exportProfile: (id: string) => Profile | null;
  importProfile: (profile: Profile) => void;
}

export function useProfile(): UseProfileReturn {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string>('');

  // Load profiles from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Profile[];
        setProfiles(parsed);
        if (storedActiveId && parsed.some(p => p.id === storedActiveId)) {
          setActiveProfileIdState(storedActiveId);
        } else if (parsed.length > 0) {
          setActiveProfileIdState(parsed[0].id);
        }
      } catch {
        // Load defaults if stored data is corrupted
        loadDefaults();
      }
    } else {
      loadDefaults();
    }
  }, []);

  const loadDefaults = () => {
    const defaults = defaultProfilesData.profiles as Profile[];
    setProfiles(defaults);
    if (defaults.length > 0) {
      setActiveProfileIdState(defaults[0].id);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  };

  // Persist profiles whenever they change
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles]);

  // Save active profile ID to localStorage when it changes
  const setActiveProfileId = useCallback((id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  const addProfile = useCallback((profile: Profile) => {
    setProfiles(prev => [...prev, profile]);
  }, []);

  const updateProfile = useCallback((id: string, updatedProfile: Profile) => {
    setProfiles(prev => prev.map(p => p.id === id ? updatedProfile : p));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    // Don't delete default profiles
    const defaults = defaultProfilesData.profiles as Profile[];
    if (defaults.some(p => p.id === id)) {
      return;
    }

    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== id);

      // If deleting active profile, switch to first available
      if (id === activeProfileId && updated.length > 0) {
        setActiveProfileId(updated[0].id);
      }

      return updated;
    });
  }, [activeProfileId, setActiveProfileId]);

  const resetToDefaults = useCallback(() => {
    const defaults = defaultProfilesData.profiles as Profile[];
    setProfiles(defaults);
    if (defaults.length > 0 && !defaults.some(p => p.id === activeProfileId)) {
      setActiveProfileId(defaults[0].id);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }, [activeProfileId, setActiveProfileId]);

  const exportProfile = useCallback((id: string): Profile | null => {
    const profile = profiles.find(p => p.id === id);
    return profile ? { ...profile } : null;
  }, [profiles]);

  const importProfile = useCallback((profile: Profile) => {
    // Generate new ID to avoid conflicts
    const newProfile: Profile = {
      ...profile,
      id: `imported-${Date.now()}`,
      name: `${profile.name} (Imported)`
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  }, [setActiveProfileId]);

  return {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    resetToDefaults,
    exportProfile,
    importProfile
  };
}
