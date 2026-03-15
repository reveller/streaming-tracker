/**
 * Invitation Controller
 *
 * HTTP request handlers for invitation endpoints.
 */

import * as invitationService from '../services/invitation.service.js';
import {
  validateCreateInvitation,
  validateRedeemInvitation,
  validateToken,
} from '../models/invitation.model.js';

/**
 * Create a new invitation (admin only).
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function createInvitation(req, res) {
  try {
    const { error, value } = validateCreateInvitation(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        },
      });
    }

    const invitation = await invitationService.createInvitation(
      req.userId,
      value.email
    );

    return res.status(201).json({
      success: true,
      data: { invitation },
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    if (error instanceof invitationService.InvitationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: 'INVITATION_ERROR',
          message: error.message,
        },
      });
    }

    console.error('Create invitation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating the invitation',
      },
    });
  }
}

/**
 * Validate an invitation token (public).
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function validateInvitationToken(req, res) {
  try {
    const { error, value } = validateToken(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        },
      });
    }

    const result = await invitationService.validateInvitationToken(value.token);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof invitationService.InvitationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: 'INVITATION_ERROR',
          message: error.message,
        },
      });
    }

    console.error('Validate token error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while validating the invitation',
      },
    });
  }
}

/**
 * Redeem an invitation to create an account (public).
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function redeemInvitation(req, res) {
  try {
    const { error, value } = validateRedeemInvitation(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        },
      });
    }

    const result = await invitationService.redeemInvitation(value.token, {
      username: value.username,
      password: value.password,
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Account created successfully',
    });
  } catch (error) {
    if (error instanceof invitationService.InvitationError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: 'INVITATION_ERROR',
          message: error.message,
        },
      });
    }

    console.error('Redeem invitation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating your account',
      },
    });
  }
}

/**
 * List all invitations for the authenticated admin (admin only).
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export async function listInvitations(req, res) {
  try {
    const invitations = await invitationService.listInvitations(req.userId);

    return res.status(200).json({
      success: true,
      data: { invitations },
    });
  } catch (error) {
    console.error('List invitations error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching invitations',
      },
    });
  }
}
