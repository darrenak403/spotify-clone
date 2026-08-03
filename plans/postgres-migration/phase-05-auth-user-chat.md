# Phase 5: Auth, User, and Chat Message Persistence

## Requirements

Rewrite everywhere a signed-in user or a chat message is looked up or created, so sign-in, the internal-user-lookup middleware, the user list, and real-time chat all work against the new database client with the same behavior as before.

## Steps

1. Rewrite the sign-in callback so it still finds-or-creates a user by their external identity provider ID in one atomic step (no separate check-then-create, to avoid duplicate user records from near-simultaneous first sign-ins).
2. Rewrite the session-token-issuing endpoint's user lookup the same way, and update what identity value gets embedded in the issued token to match the new primary key format.
3. Rewrite the shared middleware that resolves a verified caller to their internal user record — this is used on every authenticated request, so its lookup-by-external-ID behavior must stay exact.
4. Rewrite the "list all other users" endpoint to exclude the current caller by the new primary key format instead of the old one.
5. Rewrite the chat-history endpoint's "messages between these two users" query (currently an either-direction match) to the new database client's equivalent either-direction filter, preserving the existing oldest-to-newest sort order.
6. Rewrite the real-time chat handler's message-creation call so a new message still gets persisted with sender/receiver/content, keeping the existing trusted-identity-over-client-supplied-identity precedence for who the sender is.
7. Manually verify (where a live database is reachable) that signing in creates or reuses a user record correctly, and that sending a chat message both persists and is received in real time by the recipient.

## Success Criteria

- Signing in for the first time creates exactly one user record; signing in again reuses the same record without duplication.
- Every place that reads the caller's internal ID (auth middleware, user list, session token, chat) uses the new primary key consistently — no leftover references to the old ID field name.
- Chat history between two users returns messages in the same order and shape as before.
- Sending a message through the real-time handler still persists it and still delivers it to an online recipient exactly as before.

## Risks

- A leftover reference to the old internal ID field name surviving in one of these five files (auth callback, session endpoint, dbUser middleware, user-list endpoint, chat handler) — mitigate by grepping specifically for the old field-access pattern across all five files as a final check, not just the ones edited first.
- The either-direction chat-history query being translated incorrectly (e.g. only matching one direction) — mitigate by manually re-deriving the equivalent filter from the original either-direction condition rather than approximating it.
