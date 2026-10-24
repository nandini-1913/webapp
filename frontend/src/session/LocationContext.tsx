import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { formatCoordinates, reverseGeocode } from '../services/location/reverseGeocode';

const STORAGE_KEY = 'buildmate_current_location';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  updatedAt: number;
}

type AddressStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LocationContextValue {
  currentLocation: CurrentLocation | null;
  addressStatus: AddressStatus;
  addressError: string | null;
  isTracking: boolean;
  saveLocation: (location: Omit<CurrentLocation, 'updatedAt'>) => void;
  requestCurrentLocation: () => Promise<CurrentLocation>;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

function readLocation(): CurrentLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CurrentLocation>;
    if (typeof value.latitude !== 'number' || typeof value.longitude !== 'number') return null;
    return {
      latitude: value.latitude,
      longitude: value.longitude,
      accuracy: value.accuracy,
      address: value.address,
      updatedAt: value.updatedAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

function persistLocation(location: CurrentLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Storage unavailable — keep in memory only.
  }
}

function locationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was denied. Allow location access in your browser settings.';
    case error.POSITION_UNAVAILABLE:
      return 'Your current location is unavailable.';
    case error.TIMEOUT:
      return 'Getting your location took too long. Please try again.';
    default:
      return 'Unable to determine your current location.';
  }
}

function readCurrentPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('This browser does not support current location.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => reject(new Error(locationErrorMessage(error))), {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    });
  });
}

function positionToLocation(position: GeolocationPosition): CurrentLocation {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    updatedAt: Date.now(),
  };
}

function hasMovedEnough(previous: CurrentLocation, next: CurrentLocation): boolean {
  const latDelta = Math.abs(previous.latitude - next.latitude);
  const lonDelta = Math.abs(previous.longitude - next.longitude);
  return latDelta > 0.00015 || lonDelta > 0.00015;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(readLocation);
  const [addressStatus, setAddressStatus] = useState<AddressStatus>(
    currentLocation?.address ? 'ready' : 'idle',
  );
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const geocodeAbortRef = useRef<AbortController | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastGeocodedRef = useRef<CurrentLocation | null>(null);

  const resolveAddress = useCallback((location: CurrentLocation, force = false) => {
    if (
      !force &&
      lastGeocodedRef.current &&
      !hasMovedEnough(lastGeocodedRef.current, location) &&
      location.address
    ) {
      return;
    }

    geocodeAbortRef.current?.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    setAddressStatus('loading');
    setAddressError(null);

    void reverseGeocode(location.latitude, location.longitude, controller.signal)
      .then((address) => {
        if (controller.signal.aborted) return;
        const located = { ...location, address };
        lastGeocodedRef.current = located;
        setCurrentLocation(located);
        persistLocation(located);
        setAddressStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const fallback = formatCoordinates(location.latitude, location.longitude);
        const located = { ...location, address: fallback };
        lastGeocodedRef.current = located;
        setCurrentLocation(located);
        persistLocation(located);
        setAddressStatus('error');
        setAddressError(error instanceof Error ? error.message : 'Unable to look up address.');
      });
  }, []);

  const saveLocation = useCallback(
    (location: Omit<CurrentLocation, 'updatedAt'>) => {
      const next: CurrentLocation = { ...location, updatedAt: Date.now() };
      setCurrentLocation(next);
      persistLocation(next);
      resolveAddress(next, true);
    },
    [resolveAddress],
  );

  const requestCurrentLocation = useCallback(async () => {
    const position = await readCurrentPosition();
    const location = positionToLocation(position);
    saveLocation(location);
    return location;
  }, [saveLocation]);

  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current != null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = positionToLocation(position);
        setCurrentLocation((previous) => {
          if (previous && !hasMovedEnough(previous, next) && previous.address) {
            return { ...previous, accuracy: next.accuracy, updatedAt: next.updatedAt };
          }
          const withoutAddress = { ...next, address: previous?.address };
          persistLocation(withoutAddress);
          resolveAddress(withoutAddress);
          return withoutAddress;
        });
      },
      () => {
        // Keep the last known location when watch callbacks fail intermittently.
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    setIsTracking(true);
  }, [resolveAddress]);

  useEffect(() => {
    return () => {
      geocodeAbortRef.current?.abort();
      stopLiveTracking();
    };
  }, [stopLiveTracking]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        addressStatus,
        addressError,
        isTracking,
        saveLocation,
        requestCurrentLocation,
        startLiveTracking,
        stopLiveTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useCurrentLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useCurrentLocation must be used within LocationProvider');
  return context;
}
