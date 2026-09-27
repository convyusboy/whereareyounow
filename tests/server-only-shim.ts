// Stand-in for the "server-only" package under Vitest — Next.js aliases the
// real package to a no-op for server code paths internally; a plain Node/Vite
// module resolution otherwise hits its real index.js, which unconditionally
// throws "This module cannot be imported from a Client Component module."
export {};
