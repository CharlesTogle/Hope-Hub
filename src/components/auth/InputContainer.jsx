export default function InputContainer ({ children, className }) {
  return (
    <div id='form-inputs' className={`flex flex-col gap-3 ${className}`}>
      {children}
    </div>
  );
}
