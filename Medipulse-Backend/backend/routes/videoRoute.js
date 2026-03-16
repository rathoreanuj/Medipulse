import express from 'express';
import { joinVideoRoom } from '../controllers/videoController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const videoRouter = express.Router();

// POST /api/video/join-room
// Called by both patient (token header) and doctor (dtoken header)
videoRouter.post('/join-room', authLimiter, joinVideoRoom);

export default videoRouter;
