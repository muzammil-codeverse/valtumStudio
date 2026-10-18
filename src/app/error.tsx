"use client";

import { useEffect } from "react";

type RouteErrorProperties = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function RouteError({ error, reset }: RouteErrorProperties) {
  useEffect(() => {
    // The boundary intentionally does not render or transmit error details.
    console.error(error);
  }, [error]);

  return (
    <main>
      <h1>Something went wrong</h1>
      <p>Please try the request again.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
