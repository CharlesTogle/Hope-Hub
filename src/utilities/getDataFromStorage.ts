function getDataFromStorage<T>(key: string): T | null {
  const storedData = localStorage.getItem(key);
  if (!storedData) return null;
  try {
    return JSON.parse(storedData) as T;
  } catch {
    return null;
  }
}

export default getDataFromStorage;
