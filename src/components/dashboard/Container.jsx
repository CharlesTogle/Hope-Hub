export default function Container ({ children, className, id }) {
  return (
    <div
      id={id}
      className={`w-full font-content mt-3 rounded-sm p-3 overflow-hidden ${className}`}
      style={{ boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.25)' }}
    >
      {children}
    </div>
  );
}
