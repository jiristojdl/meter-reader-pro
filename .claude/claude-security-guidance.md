# Security guidance for meter-reader-pro

## Authentication & Authorization
- All Supabase RLS (Row Level Security) policies must be enabled on every table that stores user data.
- Never expose the Supabase service role key on the client side — use only the `anon` key in the browser.
- Auth state must be validated server-side in Supabase edge functions via `supabase.auth.getUser()`, not `getSession()`.
- Wrap all protected routes with the auth guard before any data fetch.

## Input Validation
- Meter reading values submitted by users (numeric fields) must be validated to reject non-numeric or out-of-range inputs before persisting.
- Image files uploaded for OCR must be validated for MIME type and size on both client and server (edge function) before processing.
- Never pass raw user input to `eval()`, template literals used as HTML, or dynamic SQL.

## AI / OCR Processing
- Do not log or store raw image data beyond what is necessary for processing; delete temporary files after OCR completes.
- OCR results are untrusted input — validate and sanitize the extracted numeric strings before inserting them into the database.
- Supabase edge functions calling external AI APIs must not forward raw user-supplied data without validation.

## Secrets & API Keys
- Supabase URL and anon key may be in `.env` files; never commit `.env` to the repository.
- AI provider API keys (e.g., OpenAI) must be stored as Supabase secrets, not hard-coded in edge function source files.
- Never hard-code credentials, tokens, or secret prefixes such as `sk-`, `sk_live_`, or `AKIA` in source files.

## DOM & React Security
- Do not use `dangerouslySetInnerHTML` unless the content has been explicitly sanitized.
- Avoid `document.write`, `innerHTML =`, and unescaped dynamic content inserted into the DOM.
- When displaying meter readings or user-supplied text, render through React's JSX (which escapes by default), not raw HTML.

## Camera & Device APIs
- Request camera permissions only at the moment of use; do not store or transmit the raw media stream.
- Release the camera stream (`track.stop()`) when the component unmounts or the user cancels.

## Supabase Edge Functions
- Always validate `Authorization` headers and verify the JWT before processing requests.
- Use parameterized queries (Supabase client methods) — never concatenate user input into query strings.
- Set strict CORS headers; do not allow `*` origins on functions that handle authenticated data.

## Dependency & Build Safety
- Keep `@supabase/supabase-js` and AI client libraries up to date; check for CVEs when upgrading.
- Do not import packages from untrusted or unofficial sources.
