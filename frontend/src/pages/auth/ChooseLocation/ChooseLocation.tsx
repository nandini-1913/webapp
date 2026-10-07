import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { TileLayer, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppRoutes } from '../../../routes/appRoutes';
import type { SignupFlowArgs } from '../../../routes/appRoutes';
import { useCurrentLocation } from '../../../session/LocationContext';
import type { CurrentLocation } from '../../../session/LocationContext';
import { CircularProgress } from '../../../shared/CircularProgress';
import { LoginFlowContinueButton } from '../../../shared/LoginFlowContinueButton';
import chooseLocationMock from './ChooseLocation.mock.json';
import {
  Screen,
  Body,
  MapArea,
  MapSurface,
  TopBar,
  RoundIconButton,
  PinCenter,
  PinBounce,
  PinHalo,
  PinHead,
  PinShadow,
  LocateMeButton,
  Sheet,
  Title,
  Subtitle,
  AddressCard,
  Switched,
  LocatedRow,
  CtaButton,
  IconBox,
  TextColumn,
  CurrentLocationLabel,
  Line1,
  Line2,
  ContinueWrap,
  LOCATE_SPINNER_SIZE,
  LOCATE_SPINNER_STROKE,
  CTA_SPINNER_SIZE,
  CTA_SPINNER_STROKE,
} from './ChooseLocation.styles';

const genericMapCenter: [number, number] = [20.5937, 78.9629];

function MapLocationEvents({
  onLocationSelected,
}: {
  onLocationSelected: (location: CurrentLocation) => void;
}) {
  useMapEvents({
    click: (event) => {
      event.target.setView(event.latlng, event.target.getZoom(), { animate: true });
      onLocationSelected({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
        accuracy: 0,
        updatedAt: new Date().toISOString(),
      });
    },
    dragend: (event) => {
      const center = event.target.getCenter();
      onLocationSelected({
        latitude: center.lat,
        longitude: center.lng,
        accuracy: 0,
        updatedAt: new Date().toISOString(),
      });
    },
  });
  return null;
}

/** AppRouter fallback when no SignupFlowArgs are passed. */
const fallbackArgs: SignupFlowArgs = { mobileNumber: '', fullName: '' };

/**
 * Step between signup and profession selection — lets the user drop a pin
 * on a (mocked) map or use their current location.
 */
export function ChooseLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const {
    currentLocation,
    addressLookupStatus,
    addressError,
    saveLocation,
    requestCurrentLocation,
  } = useCurrentLocation();
  const args = (location.state as SignupFlowArgs | null) ?? fallbackArgs;
  const isLocationUpdate = args.isLocationUpdate ?? false;

  const [locating, setLocating] = useState(currentLocation == null);
  const [located, setLocated] = useState(currentLocation != null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const locatingRef = useRef(false);
  const mountedRef = useRef(true);
  const initialCenter: [number, number] = currentLocation
    ? [currentLocation.latitude, currentLocation.longitude]
    : genericMapCenter;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    if (locatingRef.current) return;
    locatingRef.current = true;
    setLocating(true);
    setLocationError(null);
    try {
      const selected = await requestCurrentLocation();
      if (!mountedRef.current) return;
      mapRef.current?.setView(
        [selected.latitude, selected.longitude],
        chooseLocationMock.locatedZoom,
        { animate: false },
      );
      setLocated(true);
    } catch (error) {
      if (!mountedRef.current) return;
      setLocationError(error instanceof Error ? error.message : 'Could not get your location.');
    } finally {
      locatingRef.current = false;
      if (mountedRef.current) setLocating(false);
    }
  }, [requestCurrentLocation]);

  useEffect(() => {
    const timer = window.setTimeout(() => void handleUseCurrentLocation(), 0);
    return () => window.clearTimeout(timer);
  }, [handleUseCurrentLocation]);

  const handleMapLocationSelected = (selected: CurrentLocation) => {
    saveLocation(selected);
    setLocated(true);
    setLocationError(null);
  };

  const handleContinue = () => {
    if (isLocationUpdate) {
      navigate(-1);
      return;
    }
    navigate(AppRoutes.chooseProfession, { state: args });
  };

  return (
    <Screen>
      <Body>
        {/* Top half: real map surface. */}
        <MapArea>
          <MapSurface
            ref={mapRef}
            center={initialCenter}
            zoom={chooseLocationMock.initialZoom}
            zoomControl={false}
          >
            <MapLocationEvents onLocationSelected={handleMapLocationSelected} />
            <TileLayer
              url={chooseLocationMock.tileLayer.urlTemplate}
              attribution={chooseLocationMock.tileLayer.attribution}
            />
          </MapSurface>

          {/* Back button, same style used across the auth flow. */}
          <TopBar>
            <RoundIconButton type="button" aria-label="Back" onClick={() => navigate(-1)}>
              <i className="pi pi-arrow-left" />
            </RoundIconButton>
          </TopBar>

          {/* Centered pin, fixed over the map (map pans beneath it). */}
          <PinCenter>
            <PinBounce $locating={locating}>
              <PinHalo>
                <PinHead>
                  <i className="pi pi-home" />
                </PinHead>
              </PinHalo>
            </PinBounce>
            <PinShadow />
          </PinCenter>

          {/* Locate-me FAB. */}
          <LocateMeButton
            type="button"
            aria-label="Use my current location"
            onClick={handleUseCurrentLocation}
          >
            {locating ? (
              <CircularProgress
                size={LOCATE_SPINNER_SIZE}
                strokeWidth={LOCATE_SPINNER_STROKE}
                color={theme.loginFlow.accent}
              />
            ) : (
              <i className="pi pi-bullseye" />
            )}
          </LocateMeButton>
        </MapArea>

        {/* Bottom half: search + location name + confirm button. */}
        <Sheet>
          <Title>Pin your location</Title>
          <Subtitle>
            Drag the map or search to place the pin exactly where you'd like deliveries and site
            visits.
          </Subtitle>
          {locationError && <Subtitle role="alert">{locationError}</Subtitle>}
          <AddressCard>
            {located ? (
              <Switched key="located">
                <LocatedRow>
                  <IconBox $iconSize="located">
                    <i className="pi pi-map-marker" />
                  </IconBox>
                  <TextColumn>
                    <CurrentLocationLabel>
                      Current location
                      <i className="pi pi-check-circle" />
                    </CurrentLocationLabel>
                    <Line1 $gapTop>
                      {addressLookupStatus === 'loading'
                        ? 'Finding your address…'
                        : (currentLocation?.address ??
                          (currentLocation
                            ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
                            : 'Selected map location'))}
                    </Line1>
                    <Line2>
                      {addressError
                        ? `${addressError}${currentLocation ? ` Coordinates: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}` : ''}`
                        : currentLocation && currentLocation.accuracy > 0
                          ? `Location accuracy ±${Math.round(currentLocation.accuracy)} m · © OpenStreetMap contributors`
                          : 'Tap or drag the map to adjust your location · © OpenStreetMap contributors'}
                    </Line2>
                  </TextColumn>
                </LocatedRow>
              </Switched>
            ) : (
              <Switched key="cta">
                <CtaButton type="button" onClick={handleUseCurrentLocation}>
                  <IconBox $iconSize="cta">
                    {locating ? (
                      <CircularProgress
                        size={CTA_SPINNER_SIZE}
                        strokeWidth={CTA_SPINNER_STROKE}
                        color={theme.loginFlow.accent}
                      />
                    ) : (
                      <i className="pi pi-bullseye" />
                    )}
                  </IconBox>
                  <TextColumn>
                    <Line1>{locating ? 'Finding your location…' : 'Use my current location'}</Line1>
                    <Line2>Or drag the pin to fine-tune it manually</Line2>
                  </TextColumn>
                </CtaButton>
              </Switched>
            )}
            <ContinueWrap>
              <LoginFlowContinueButton
                label="Confirm & continue"
                enabled={located}
                onPressed={handleContinue}
              />
            </ContinueWrap>
          </AddressCard>
        </Sheet>
      </Body>
    </Screen>
  );
}
