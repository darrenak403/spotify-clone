# Phase 3: Socket.io Handshake Authentication Fix

## Requirements

Real-time chat connections are authenticated — a socket can no longer claim to be any user simply by sending a raw user id, closing a pre-existing security gap unrelated to the original Clerk/Firebase swap.

## Steps

1. Add a connection-time check to the real-time server that, if a backend session token is present, validates it (from Phase 2's session endpoint) and uses the resulting identity.
2. **Transition step, chosen to avoid disrupting users active during deploy**: temporarily still accept the old, unauthenticated client-supplied `userId` as a fallback when no session token is present, so currently-connected/mid-deploy clients aren't dropped the instant this phase's backend change ships, before the paired frontend change (Phase 4 step 6) has rolled out to every client. Log a warning on every fallback path hit, so usage of the legacy path is visible and trackable.
3. Once the frontend change from Phase 4 is confirmed deployed and no fresh legacy-path log lines appear for a reasonable observation window (e.g. a day), remove the fallback entirely so an unauthenticated connection is rejected outright — this closes the gap for real. Track this removal as an explicit follow-up step of this phase, not an indefinite "leave it for later."
4. Derive the connected user's identity from the validated token (not the fallback path, once removed) and use that trusted identity everywhere the server currently tracks "who is online" and "who sent this message."
5. Confirm that sending and receiving chat messages, presence updates ("online" list), and activity status updates all continue to work end-to-end using the trusted identity instead of the client-supplied one.
6. Silent token refresh: when a connected client's session token is at or near its 24-hour expiry (or the socket disconnects because it expired), the frontend should transparently fetch a new session token (via Phase 2's `/api/auth/session`, using its still-valid or auto-refreshed Firebase ID token) and reconnect — no user-visible re-login. Treat this reconnect as expected behavior, not an error path.
7. Manually verify: a client without a valid session token is handled per the current step of the transition (accepted via fallback, or rejected once fallback is removed); a client with a valid token connects, appears in the online list, and can send/receive a message that shows the correct sender; a client whose session token expires mid-connection silently reconnects with a fresh token without requiring the user to log in again.

## Success Criteria

- During the transition window: a client with a valid session token connects using the trusted identity; a client without one still connects via the logged fallback path (temporary).
- After the fallback is removed: connecting to the real-time server without a valid session token is refused outright.
- Connecting with a valid session token succeeds, and the connected user's identity used server-side matches their authenticated session, not a client-supplied value.
- Sending a chat message, seeing presence/online status, and activity updates all work correctly for an authenticated connection.
- A client whose session token expires mid-connection reconnects automatically with a fresh token, with no user-visible interruption beyond a brief reconnect.

## Risks

- The transition fallback (step 2) means the zero-auth gap isn't fully closed until step 3's removal actually happens — track this as a real follow-up, not something quietly left in place indefinitely.
- Session token nearing/reaching expiry mid-connection: treat the resulting disconnect as an expected case the client should reconnect from (fetch a fresh session token and reconnect), not an unhandled error state.
- Fallback-path log lines need to actually be checked before removing the fallback (step 3) — removing it on a fixed calendar date without checking usage risks cutting off a client that hasn't updated yet.
