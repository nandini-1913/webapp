const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

let lastRequestAt = 0;

async function waitForNominatimSlot() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestAt = Date.now();
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string> {
  await waitForNominatimSlot();

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
  });

  const response = await fetch(`${NOMINATIM_REVERSE}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Address lookup failed.');
  }

  const payload = (await response.json()) as { display_name?: string };
  const address = payload.display_name?.trim();
  if (!address) {
    throw new Error('No address was found for this location.');
  }

  return address;
}
