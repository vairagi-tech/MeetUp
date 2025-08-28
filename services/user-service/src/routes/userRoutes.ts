import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = Router();
const userController = new UserController();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).messages({
    'string.min': 'First name cannot be empty',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().trim().min(1).max(50).messages({
    'string.min': 'Last name cannot be empty',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  university: Joi.string().trim().min(1).max(100).messages({
    'string.min': 'University cannot be empty',
    'string.max': 'University name cannot exceed 100 characters'
  }),
  batch: Joi.string().trim().min(1).max(20).messages({
    'string.min': 'Batch cannot be empty',
    'string.max': 'Batch cannot exceed 20 characters'
  }),
  course: Joi.string().trim().min(1).max(100).messages({
    'string.min': 'Course cannot be empty',
    'string.max': 'Course name cannot exceed 100 characters'
  }),
  privacySettings: Joi.object({
    showSchedule: Joi.string().valid('public', 'friends', 'private'),
    showLocation: Joi.string().valid('public', 'friends', 'private'),
    allowFriendRequests: Joi.boolean(),
    showOnlineStatus: Joi.boolean()
  })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const searchUsersSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100),
  university: Joi.string().trim().max(100),
  batch: Joi.string().trim().max(20),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
}).or('q', 'university', 'batch').messages({
  'object.missing': 'At least one search parameter (q, university, or batch) is required'
});

const universityBatchSchema = Joi.object({
  university: Joi.string().trim().required().messages({
    'any.required': 'University is required'
  }),
  batch: Joi.string().trim().required().messages({
    'any.required': 'Batch is required'
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const privacySettingsSchema = Joi.object({
  showSchedule: Joi.string().valid('public', 'friends', 'private'),
  showLocation: Joi.string().valid('public', 'friends', 'private'),
  allowFriendRequests: Joi.boolean(),
  showOnlineStatus: Joi.boolean()
}).min(1).messages({
  'object.min': 'At least one privacy setting must be provided'
});

const deactivateAccountSchema = Joi.object({
  password: Joi.string().required().messages({
    'any.required': 'Password is required to deactivate account'
  })
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Profile management routes
router.put('/profile', validateRequest(updateProfileSchema), userController.updateProfile);
router.post('/upload-photo', uploadMiddleware.single('photo'), userController.uploadPhoto);
router.get('/profile', userController.getUserStats);

// User discovery routes
router.get('/search', validateRequest(searchUsersSchema, 'query'), userController.searchUsers);
router.get('/university-batch', validateRequest(universityBatchSchema, 'query'), userController.getUsersByUniversityAndBatch);
router.get('/:userId', userController.getUserById);

// Privacy settings
router.put('/privacy', validateRequest(privacySettingsSchema), userController.updatePrivacySettings);

// Account management
router.post('/deactivate', validateRequest(deactivateAccountSchema), userController.deactivateAccount);

export { router as userRoutes };
