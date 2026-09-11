export default function Logo({ size = 32 }) {
  return (
    <img
      src="/logo.svg"
      alt="CipherSchools"
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
