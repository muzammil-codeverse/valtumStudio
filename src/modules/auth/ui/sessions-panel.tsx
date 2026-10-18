"use client";

import { useEffect, useState } from "react";

import { authClient } from "./auth-client";

type SessionSummary = Readonly<{
  createdAt: string;
  current: boolean;
  device: string;
  expiresAt: string;
  id: string;
  ipAddress?: string;
  updatedAt: string;
}>;

export function SessionsPanel(): React.JSX.Element {
  const [error, setError] = useState<string>();
  const [sessions, setSessions] = useState<readonly SessionSummary[]>();

  async function loadSessions(): Promise<void> {
    const response = await fetch("/api/security/sessions", { cache: "no-store" });
    if (!response.ok) {
      setError("Sessions could not be loaded.");
      return;
    }
    const body: unknown = await response.json();
    if (
      body !== null &&
      typeof body === "object" &&
      Array.isArray((body as { sessions?: unknown }).sessions)
    ) {
      setSessions((body as { sessions: SessionSummary[] }).sessions);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/security/sessions", {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Sessions could not be loaded.");
        return response.json() as Promise<unknown>;
      })
      .then((body) => {
        if (
          !controller.signal.aborted &&
          body !== null &&
          typeof body === "object" &&
          Array.isArray((body as { sessions?: unknown }).sessions)
        ) {
          setSessions((body as { sessions: SessionSummary[] }).sessions);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Sessions could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  async function revoke(sessionId?: string, allOtherSessions = false): Promise<void> {
    const confirmation = allOtherSessions
      ? "Revoke every other active session?"
      : "Revoke this active session?";
    if (!window.confirm(confirmation)) return;
    const response = await fetch("/api/security/sessions", {
      body: JSON.stringify(
        allOtherSessions ? { allOtherSessions: true } : { sessionId }
      ),
      headers: { "Content-Type": "application/json" },
      method: "DELETE"
    });
    if (!response.ok) {
      setError("The session could not be revoked.");
      return;
    }
    await loadSessions();
  }

  async function signOut(): Promise<void> {
    await authClient.signOut();
    window.location.assign("/auth/sign-in");
  }

  return (
    <div>
      <p>Revoked sessions are rejected on their next protected request.</p>
      <button onClick={() => revoke(undefined, true)} type="button">
        Revoke all other sessions
      </button>
      <button onClick={signOut} type="button">
        Sign out this session
      </button>
      {error === undefined ? null : (
        <p aria-live="polite" className="auth-error" role="alert">
          {error}
        </p>
      )}
      {sessions === undefined ? (
        <p>Loading sessions…</p>
      ) : (
        <ul className="session-list">
          {sessions.map((session) => (
            <li key={session.id}>
              <strong>{session.current ? "Current session" : session.device}</strong>
              <span>Created {new Date(session.createdAt).toLocaleString()}</span>
              <span>Last active {new Date(session.updatedAt).toLocaleString()}</span>
              <span>Expires {new Date(session.expiresAt).toLocaleString()}</span>
              {session.ipAddress === undefined ? null : (
                <span>Network location recorded</span>
              )}
              {session.current ? null : (
                <button onClick={() => revoke(session.id)} type="button">
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
