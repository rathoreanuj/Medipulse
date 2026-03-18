import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import logger from '../utils/logger.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/user/google-auth
 * Body: { credential }  — the Google ID token from @react-oauth/google
 *
 * Flow:
 *   1. Verify the Google ID token
 *   2. Find or create the user by email (googleId stored for reference)
 *   3. Return a full MediPulse JWT (same shape as normal login)
 */
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.json({ success: false, message: 'Google credential is required' });
        }

        // Verify the token against Google's public keys
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.json({ success: false, message: 'Could not retrieve email from Google account' });
        }

        // Find existing user or create a new one (no password required for OAuth users)
        let user = await userModel.findOne({ email });

        if (user) {
            // If this user registered with email/password (not Google), reject the request
            if (!user.googleId && user.password && !user.password.startsWith('google_oauth_')) {
                return res.json({
                    success: false,
                    message: 'An account with this email already exists. Please log in with your email and password.'
                });
            }
            // Existing Google user — update googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.image && picture) user.image = picture;
                await user.save();
            }
        } else {
            // New user — register via Google
            user = await userModel.create({
                name,
                email,
                password: `google_oauth_${googleId}`, // placeholder — not usable for password login
                image: picture || '',
                googleId,
            });
        }

        // Issue full MediPulse JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            message: 'Google sign-in successful',
        });
    } catch (error) {
        logger.error('Google Auth error', { error: error.message });
        res.json({ success: false, message: 'Google authentication failed. Please try again.' });
    }
};

export { googleAuth };
