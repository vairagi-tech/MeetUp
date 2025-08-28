import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import Joi from 'joi';

const router = Router();
const authController = new AuthController();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  username: Joi.string().alphanum().min(3).max(20).required().messages({
    'string.alphanum': 'Username can only contain letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 20 characters',
    'any.required': 'Username is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    'string.min': 'First name is required',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().trim().min(1).max(50).required().messages({
    'string.min': 'Last name is required',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  university: Joi.string().trim().min(1).max(100).required().messages({
    'string.min': 'University is required',
    'string.max': 'University name cannot exceed 100 characters',
    'any.required': 'University is required'
  }),
  batch: Joi.string().trim().min(1).max(20).required().messages({
    'string.min': 'Batch/Year is required',
    'string.max': 'Batch cannot exceed 20 characters',
    'any.required': 'Batch/Year is required'
  }),
  course: Joi.string().trim().min(1).max(100).required().messages({
    'string.min': 'Course/Program is required',
    'string.max': 'Course name cannot exceed 100 characters',
    'any.required': 'Course/Program is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Verification token is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
    'any.required': 'Password is required'
  })
});

// Routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

export { router as authRoutes };
