/**
 * Local stand-in for the server AppRouter type.
 * The client package is built on Railway from the client folder alone, so it
 * must not import anything from ../server.
 *
 * Procedure calls stay the same at runtime; this only affects TypeScript.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppRouter = any;
