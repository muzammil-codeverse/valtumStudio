# Session policy

Sessions are opaque database records issued by Better Auth. They expire after 43,200
seconds, refresh after 3,600 seconds, and are rejected after 604,800 seconds even if a
row remains otherwise valid. Cookie cache is disabled. Cookies are `HttpOnly`,
`SameSite=Lax`, prefixed `siglum`, and `Secure` in production.

Users can list safe device/session summaries, revoke individual non-current sessions, or
revoke all other sessions. Password changes and operator resets revoke other/all
sessions. Sign-out uses Better Auth and records an event when a server session was
present. Never render, return, log, or persist raw session tokens outside Better Auth
storage.
