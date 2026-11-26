export default function Loading() {
  return (
    <span
      role="status"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clipPath: "inset(50%)",
        whiteSpace: "nowrap"
      }}
    >
      Loading…
    </span>
  );
}
