/**
 * User Model and Validation
 *
 * Defines the structure and validation rules for user data.
 */

import Joi from 'joi';

/**
 * User registration validation schema.
 *
 * @type {Joi.ObjectSchema}
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .max(255)
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
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
      'any.required': 'Username is required'
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
      'any.required': 'Password is required'
    })
});

/**
 * User login validation schema.
 *
 * @type {Joi.ObjectSchema}
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

/**
 * User profile update validation schema.
 *
 * @type {Joi.ObjectSchema}
 */
export const updateProfileSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
    }),

  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .max(255)
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 255 characters'
    })
}).min(1);

/**
 * Password change validation schema.
 *
 * @type {Joi.ObjectSchema}
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .required()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password must not exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.invalid': 'New password must be different from current password',
      'any.required': 'New password is required'
    })
});

/**
 * Validate user registration data.
 *
 * @param {Object} data - User registration data
 * @returns {Object} Validation result
 */
export function validateRegister(data) {
  return registerSchema.validate(data, { abortEarly: false });
}

/**
 * Validate user login data.
 *
 * @param {Object} data - User login data
 * @returns {Object} Validation result
 */
export function validateLogin(data) {
  return loginSchema.validate(data, { abortEarly: false });
}

/**
 * Validate user profile update data.
 *
 * @param {Object} data - User profile update data
 * @returns {Object} Validation result
 */
export function validateUpdateProfile(data) {
  return updateProfileSchema.validate(data, { abortEarly: false });
}

/**
 * Validate password change data.
 *
 * @param {Object} data - Password change data
 * @returns {Object} Validation result
 */
export function validateChangePassword(data) {
  return changePasswordSchema.validate(data, { abortEarly: false });
}
