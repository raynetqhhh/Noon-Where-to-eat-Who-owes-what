import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProd } from './config/env.js';
import { authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';

const app = express();

// Behind a host like Render/Railway/Fly, trust the first proxy so rate
// limiting sees the real client IP.
if (isProd) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '20kb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));

app.use('/api', apiLimiter, authenticateUser, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
