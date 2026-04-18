export default function FormContainer ({ children, ref, className }) {
  return (
    <div
      className={`md:scale-90 p-8 flex justify-center flex-col bg-white gap-2.5 lg:min-w-[37%] lg:max-w-[37%] md:min-w-[50%] md:max-w-[50%] rounded-md ${className}`}
      ref={ref ? ref : undefined}
    >
      {children}
    </div>
  );
}
