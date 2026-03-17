import express from 'express';
import { joinVideoRoom } from '../controllers/videoController.js';
import { generateConsultationSummary } from '../controllers/consultationSummaryController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const videoRouter = express.Router();

// POST /api/video/join-room
videoRouter.post('/join-room', authLimiter, joinVideoRoom);

// POST /api/video/generate-summary  (doctor only — dtoken header required)
videoRouter.post('/generate-summary', generateConsultationSummary);

export default videoRouter;
