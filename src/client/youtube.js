// src/client/youtubeFetch.js
export const KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export default async function youtube (endpoint, params = {}) {
  const baseURL = 'https://www.googleapis.com/youtube/v3';
  const query = new URLSearchParams({ key: KEY, ...params }).toString();
  const url = `${baseURL}/${endpoint}?${query}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const errReason = data.error?.errors?.[0]?.reason || 'unknown';
    throw new Error(
      `${data.error?.message || 'YouTube API error'} (reason: ${errReason})`,
    );
  }

  return data;
}
