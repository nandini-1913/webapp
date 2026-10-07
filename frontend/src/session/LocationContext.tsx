import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'buildmate_current_location';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  updatedAt: string;
  address?: string;
}

export type AddressLookupStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LocationContextValue {
  currentLocation: CurrentLocation | null;
  addressLookupStatus: AddressLookupStatus;
  addressError: string | null;
  saveLocation: (location: CurrentLocation) => void;
  requestCurrentLocation: () => Promise<CurrentLocation>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

function readLocation(): CurrentLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CurrentLocation>;
    if (
      typeof value.latitude !== 'number' ||
      typeof value.longitude !== 'number' ||
      typeof value.accuracy !== 'number' ||
      typeof value.updatedAt !== 'string' ||
      (value.address !== undefined && typeof value.address !== 'string')
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return value as CurrentLocation;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

async function reverseGeocode(location: CurrentLocation, signal: AbortSignal): Promise<string> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(location.latitude),
    lon: String(location.longitude),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Address lookup failed (HTTP ${response.status}).`);
  }

  const result: unknown = await response.json();
  if (typeof result !== 'object' || result === null) {
    throw new Error('No address was found for this location.');
  }
  const displayName = 'display_name' in result ? result.display_name : undefined;
  if (typeof displayName !== 'string' || displayName === '') {
    throw new Error('No address was found for this location.');
  }
  return displayName;
}

function locationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was denied. Allow location access in your browser settings and try again.';
    case error.POSITION_UNAVAILABLE:
      return 'Your current location is unavailable. Check your device location settings and try again.';
    case error.TIMEOUT:
      return 'Getting your location took too long. Please try again.';
    default:
      return 'Unable to determine your current location.';
  }
}

function readCurrentLocation(): Promise<CurrentLocation> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('This browser does not support current location.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: new Date(position.timestamp).toISOString(),
        }),
      (error) => reject(new Error(locationErrorMessage(error))),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  });
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(readLocation);
  const [addressLookupStatus, setAddressLookupStatus] = useState<AddressLookupStatus>(() =>
    currentLocation?.address ? 'ready' : 'idle',
  );
  const [addressError, setAddressError] = useState<string | null>(null);
  const latestLookup = useRef(0);
  const lookupTimer = useRef<number | null>(null);
  const lookupController = useRef<AbortController | null>(null);
  const lastLookupAt = useRef(0);

  const saveLocation = useCallback((location: CurrentLocation) => {
    const lookupId = ++latestLookup.current;
    if (lookupTimer.current !== null) window.clearTimeout(lookupTimer.current);
    lookupController.current?.abort();
    const locationWithoutAddress = { ...location, address: undefined };
    setCurrentLocation(locationWithoutAddress);
    setAddressLookupStatus('loading');
    setAddressError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locationWithoutAddress));
    } catch {
      // Keep the selected location available in memory for this page session.
    }

    const delay = Math.max(0, 1000 - (Date.now() - lastLookupAt.current));
    lookupTimer.current = window.setTimeout(() => {
      const controller = new AbortController();
      lookupController.current = controller;
      lastLookupAt.current = Date.now();
      void reverseGeocode(location, controller.signal)
        .then((address) => {
          if (lookupId !== latestLookup.current) return;
          const located = { ...location, address };
          setCurrentLocation(located);
          setAddressLookupStatus('ready');
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(located));
          } catch {
            // Keep the resolved address available in memory for this page session.
          }
        })
        .catch((error: unknown) => {
          if (lookupId !== latestLookup.current) return;
          setAddressLookupStatus('error');
          setAddressError(
            error instanceof Error
              ? error.message
              : 'Unable to look up the address for this location.',
          );
        });
    }, delay);
  }, []);

  const requestCurrentLocation = useCallback(async () => {
    const location = await readCurrentLocation();
    saveLocation(location);
    return location;
  }, [saveLocation]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        addressLookupStatus,
        addressError,
        saveLocation,
        requestCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useCurrentLocation must be used within LocationProvider');
  return context;
}
