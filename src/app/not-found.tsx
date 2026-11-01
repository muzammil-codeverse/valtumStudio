import PublicLayout from "./(public)/layout";
import PublicNotFound from "./(public)/not-found";

export default function NotFound(): React.JSX.Element {
  return (
    <PublicLayout>
      <PublicNotFound />
    </PublicLayout>
  );
}
