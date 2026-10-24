import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { TileLayer } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AppRoutes } from '../../../routes/appRoutes';
import type { SignupFlowArgs } from '../../../routes/appRoutes';
import { useCurrentLocation } from '../../../session/LocationContext';
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
  SearchField,
  SearchHint,
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

const { _defaultCenter: defaultCenter } = chooseLocationMock;

/** AppRouter fallback when no SignupFlowArgs are passed. */
const fallbackArgs: SignupFlowArgs = { mobileNumber: '', fullName: '' };

function splitAddress(address: string): { line1: string; line2: string } {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return { line1: address, line2: '' };
  return { line1: parts[0], line2: parts.slice(1).join(', ') };
}

/**
 * Step between signup and profession selection — map pin + live GPS.
 */
export function ChooseLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const args = (location.state as SignupFlowArgs | null) ?? fallbackArgs;
  const isLocationUpdate = args.isLocationUpdate ?? false;

  const { currentLocation, addressStatus, saveLocation, requestCurrentLocation } =
    useCurrentLocation();

  const initialCenter = useMemo<[number, number]>(
    () =>
      currentLocation
        ? [currentLocation.latitude, currentLocation.longitude]
        : [defaultCenter.latitude, defaultCenter.longitude],
    [currentLocation],
  );

  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(Boolean(currentLocation));
  const [locateError, setLocateError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const locatingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncMapCenterToLocation = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    setLocated(true);
    saveLocation({ latitude: center.lat, longitude: center.lng });
  }, [saveLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.on('moveend', syncMapCenterToLocation);
    return () => {
      map.off('moveend', syncMapCenterToLocation);
    };
  }, [syncMapCenterToLocation, located]);

  useEffect(() => {
    if (!currentLocation || !mapRef.current) return;
    mapRef.current.setView(
      [currentLocation.latitude, currentLocation.longitude],
      chooseLocationMock.locatedZoom,
      { animate: false },
    );
    setLocated(true);
  }, [currentLocation]);

  const handleUseCurrentLocation = async () => {
    if (locatingRef.current) return;
    locatingRef.current = true;
    setLocating(true);
    setLocateError(null);

    try {
      const next = await requestCurrentLocation();
      if (!mountedRef.current) return;
      mapRef.current?.setView(
        [next.latitude, next.longitude],
        chooseLocationMock.locatedZoom,
        { animate: true },
      );
      setLocated(true);
    } catch (error) {
      if (mountedRef.current) {
        setLocateError(error instanceof Error ? error.message : 'Unable to read GPS location.');
      }
    } finally {
      locatingRef.current = false;
      if (mountedRef.current) setLocating(false);
    }
  };

  const handleContinue = () => {
    syncMapCenterToLocation();
    if (isLocationUpdate) {
      navigate(-1);
      return;
    }
    navigate(AppRoutes.chooseProfession, { state: args });
  };

  const addressLines = currentLocation?.address
    ? splitAddress(currentLocation.address)
    : null;

  return (
    <Screen>
      <Body>
        <MapArea>
          <MapSurface
            ref={mapRef}
            center={initialCenter}
            zoom={chooseLocationMock.initialZoom}
            zoomControl={false}
          >
            <TileLayer
              url={chooseLocationMock.tileLayer.urlTemplate}
              attribution={chooseLocationMock.tileLayer.attribution}
            />
          </MapSurface>

          <TopBar>
            <RoundIconButton type="button" aria-label="Back" onClick={() => navigate(-1)}>
              <i className="pi pi-arrow-left" />
            </RoundIconButton>
          </TopBar>

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

        <Sheet>
          <Title>Pin your location</Title>
          <Subtitle>
            Drag the map or search to place the pin exactly where you'd like deliveries and site
            visits.
          </Subtitle>
          <SearchField>
            <i className="pi pi-search" />
            <SearchHint>Search area, street or landmark</SearchHint>
          </SearchField>
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
                    {addressStatus === 'loading' && !addressLines ? (
                      <Line1 $gapTop>Looking up address…</Line1>
                    ) : (
                      <>
                        <Line1 $gapTop>{addressLines?.line1 ?? 'Pinned map location'}</Line1>
                        {addressLines?.line2 ? <Line2>{addressLines.line2}</Line2> : null}
                      </>
                    )}
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
                    <Line2>
                      {locateError ?? 'Or drag the map to fine-tune the pin manually'}
                    </Line2>
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
