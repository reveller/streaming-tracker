/**
 * Invitation Model and Validation
 *
 * Defines Joi validation schemas for invitation-related operations.
 */

import Joi from 'joi';

/**
 * Schema for creating a new invitation.
 *
 * @type {Joi.ObjectSchema}
 */
export const createInvitationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .max(255)
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
});

/**
 * Schema for redeeming an invitation (registration via invite).
 *
 * @type {Joi.ObjectSchema}
 */
export const redeemInvitationSchema = Joi.object({
  token: Joi.string()
    .required()
    .trim()
    .messages({
      'string.empty': 'Invitation token is required',
      'any.required': 'Invitation token is required',
    }),

  username: Joi.string()
    .required()
    .trim()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
      'any.required': 'Username is required',
    }),

  password: Joi.string()
    .required()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
});

/**
 * Schema for validating an invitation token query parameter.
 *
 * @type {Joi.ObjectSchema}
 */
export const validateTokenSchema = Joi.object({
  token: Joi.string()
    .required()
    .trim()
    .messages({
      'string.empty': 'Invitation token is required',
      'any.required': 'Invitation token is required',
    }),
});

/**
 * Validate create invitation request data.
 *
 * @param {Object} data - Request body data
 * @returns {Object} Joi validation result with error and value
 */
export function validateCreateInvitation(data) {
  return createInvitationSchema.validate(data, { abortEarly: false });
}

/**
 * Validate redeem invitation request data.
 *
 * @param {Object} data - Request body data
 * @returns {Object} Joi validation result with error and value
 */
export function validateRedeemInvitation(data) {
  return redeemInvitationSchema.validate(data, { abortEarly: false });
}

/**
 * Validate invitation token query parameter.
 *
 * @param {Object} data - Query parameter data
 * @returns {Object} Joi validation result with error and value
 */
export function validateToken(data) {
  return validateTokenSchema.validate(data, { abortEarly: false });
}
