import { config } from "dotenv";

// Vitest doesn't get Next.js's automatic .env.local loading, so it's done
// explicitly here. Integration tests run against whatever project this
// points at — keep this pointed at the TESTING database, never the real one.
config({ path: ".env.local" });
