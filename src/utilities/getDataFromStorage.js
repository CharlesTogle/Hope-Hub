const getDataFromStorage = (value) => {
  const storedData = localStorage.getItem(value);
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    return parsedData;
  } else {
    return {};
  }
};

export default getDataFromStorage;
