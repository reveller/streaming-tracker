/**
 * Invitation Routes
 *
 * Defines routes for the invitation-only registration system.
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import {
  createInvitation,
  validateInvitationToken,
  redeemInvitation,
  listInvitations,
} from '../controllers/invitation.controller.js';

const router = express.Router();

/**
 * POST /api/invitations
 * Create a new invitation (admin only).
 */
router.post('/', requireAuth, requireAdmin, createInvitation);

/**
 * GET /api/invitations
 * List all invitations for the admin (admin only).
 */
router.get('/', requireAuth, requireAdmin, listInvitations);

/**
 * GET /api/invitations/validate?token=xxx
 * Validate an invitation token (public).
 */
router.get('/validate', validateInvitationToken);

/**
 * POST /api/invitations/redeem
 * Redeem an invitation to create an account (public).
 */
router.post('/redeem', redeemInvitation);

export default router;
