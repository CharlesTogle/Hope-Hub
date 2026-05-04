function getDataFromStorage<T>(key: string): T | null {
  const storedData = localStorage.getItem(key);
  if (!storedData) return null;
  return JSON.parse(storedData) as T;
}

export default getDataFromStorage;
