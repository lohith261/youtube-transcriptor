import rateLimit from 'express-rate-limit';

export const singleVideoLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests for single video transcripts. Please wait a minute.',
    code: 'RATE_LIMITED',
  },
});

export const playlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many playlist requests. Please wait a minute.',
    code: 'RATE_LIMITED',
  },
});
