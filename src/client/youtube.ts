// src/client/youtubeFetch.js
export const KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

type YouTubeParams = Record<string, string | number | boolean>;

export default async function youtube(
  endpoint: string,
  params: YouTubeParams = {},
): Promise<JsonObject> {
  const baseURL = 'https://www.googleapis.com/youtube/v3';
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);
  const query = new URLSearchParams({
    key: KEY,
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
  }).toString();
  const url = `${baseURL}/${endpoint}?${query}`;

  let res: Response;

  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('YouTube request timed out');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = (await res.json()) as JsonObject;

  if (!res.ok) {
    const errorInfo =
      typeof data.error === 'object' && data.error !== null
        ? (data.error as JsonObject)
        : null;
    const errorMessage =
      typeof errorInfo?.message === 'string'
        ? errorInfo.message
        : 'YouTube API error';
    throw new Error(
      errorMessage,
    );
  }

  return data;
}
