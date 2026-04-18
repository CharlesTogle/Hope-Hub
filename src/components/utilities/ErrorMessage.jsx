export default function ErrorMessage({text, subText}) {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center">
      <p className="text-3xl font-content font-bold">{text}</p>
      <p className="text-2xl font-content mt-3">{subText}</p>
    </div>
  );
}
