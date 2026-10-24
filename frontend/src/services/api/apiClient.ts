export const DEFAULT_API_BASE_URL = 'http://187.127.148.44';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  const base = fromEnv || DEFAULT_API_BASE_URL;
  return base.replace(/\/$/, '');
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${getApiBaseUrl()}/api/${path.replace(/^\//, '')}`;
  const response = await fetch(url, { cache: 'no-store', signal });

  let body: ApiEnvelope<T>;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok || !body.success) {
    throw new Error(body.error ?? `Request failed (${response.status}).`);
  }

  return body.data;
}
