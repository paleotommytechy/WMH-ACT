import app, { createServer } from "../server";

// Ensure server is initialized (routes registered)
await createServer();

// Vercel expects the express app to be exported
export default app;
