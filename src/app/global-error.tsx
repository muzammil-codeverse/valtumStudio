"use client";

import { useEffect } from "react";

type GlobalErrorProperties = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalError({ error, reset }: GlobalErrorProperties) {
  useEffect(() => {
    // Global boundaries cannot use the server logger; avoid exposing details in UI.
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main>
          <h1>Application error</h1>
          <p>Please try again.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
