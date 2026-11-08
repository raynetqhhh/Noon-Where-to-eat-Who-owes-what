// Vercel entry point: runs the whole Express API as one serverless function.
// vercel.json rewrites every /api/* request here; Express then routes it as
// usual (req.url keeps the original path). Locally, use `npm run dev:server`.
import app from '../server/src/app.js';

export default app;
