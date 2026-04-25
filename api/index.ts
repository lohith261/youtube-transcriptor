// Vercel serverless entry point — wraps the Express app.
// Vercel routes all /api/* requests here; Express handles them normally.
import app from '../backend/src/app';

export default app;
