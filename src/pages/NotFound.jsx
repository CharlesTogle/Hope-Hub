import { NavLink } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">404 - Not Found</h1>
      <p className="text-lg">The page you are looking for does not exist.</p>
      <NavLink to="/" className="mt-4 text-blue-500 hover:underline">
        Go back to Home
      </NavLink>
    </div>
  );
}
