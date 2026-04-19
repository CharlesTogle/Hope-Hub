import { useState, useEffect } from "react";

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchData = async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
};

export default useFetch;


// sample use
// import React from "react";
// import useFetch from "./useFetch"; // Adjust the import path as needed

// const MyComponent = () => {
//   const { data, loading, error } = useFetch("https://jsonplaceholder.typicode.com/posts");

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>Error: {error}</p>;

//   return (
//     <ul>
//       {data.map((post) => (
//         <li key={post.id}>{post.title}</li>
//       ))}
//     </ul>
//   );
// };

// export default MyComponent;