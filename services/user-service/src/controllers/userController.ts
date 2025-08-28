import { Request, Response } from 'express';
import { User, IUserDocument } from '../models/User';
import { ValidationUtils, ResponseUtils } from '../../../../../shared/src/utils';
import { FileUploadService } from '../services/fileUploadService';

export class UserController {
  private fileUploadService: FileUploadService;

  constructor() {
    this.fileUploadService = new FileUploadService();
  }

  // Update user profile
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const {
        firstName,
        lastName,
        university,
        batch,
        course,
        privacySettings
      } = req.body;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      // Update fields if provided
      if (firstName) user.firstName = ValidationUtils.sanitizeInput(firstName);
      if (lastName) user.lastName = ValidationUtils.sanitizeInput(lastName);
      if (university) user.university = ValidationUtils.sanitizeInput(university);
      if (batch) user.batch = ValidationUtils.sanitizeInput(batch);
      if (course) user.course = ValidationUtils.sanitizeInput(course);
      
      if (privacySettings) {
        // Validate privacy settings
        const validShowOptions = ['public', 'friends', 'private'];
        
        if (privacySettings.showSchedule && !validShowOptions.includes(privacySettings.showSchedule)) {
          res.status(400).json(ResponseUtils.error('Invalid showSchedule value'));
          return;
        }
        
        if (privacySettings.showLocation && !validShowOptions.includes(privacySettings.showLocation)) {
          res.status(400).json(ResponseUtils.error('Invalid showLocation value'));
          return;
        }

        // Update privacy settings
        user.privacySettings = {
          ...user.privacySettings,
          ...privacySettings
        };
      }

      await user.save();

      res.status(200).json(ResponseUtils.success(
        user.toJSON(),
        'Profile updated successfully'
      ));

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json(ResponseUtils.error(validationErrors[0]));
        return;
      }

      res.status(500).json(ResponseUtils.error('Failed to update profile'));
    }
  };

  // Upload profile photo
  public uploadPhoto = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      if (!req.file) {
        res.status(400).json(ResponseUtils.error('No file uploaded'));
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      // Upload photo to cloud storage
      const photoUrl = await this.fileUploadService.uploadProfilePhoto(
        req.file.buffer,
        userId,
        req.file.mimetype
      );

      // Update user photo URL
      user.photo = photoUrl;
      await user.save();

      res.status(200).json(ResponseUtils.success({
        photo: photoUrl
      }, 'Profile photo updated successfully'));

    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json(ResponseUtils.error('Failed to upload photo'));
    }
  };

  // Get user by ID
  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const currentUserId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(400).json(ResponseUtils.error('User ID is required'));
        return;
      }

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      // Check privacy settings
      let userData = user.toJSON();
      
      // If not the same user and privacy settings restrict access
      if (currentUserId !== userId) {
        // Remove sensitive information based on privacy settings
        if (user.privacySettings.showSchedule === 'private') {
          // Additional privacy logic can be added here
        }
      }

      res.status(200).json(ResponseUtils.success(userData, 'User retrieved successfully'));

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json(ResponseUtils.error('Failed to retrieve user'));
    }
  };

  // Search users
  public searchUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUserId = req.headers['x-user-id'] as string;
      const currentUserUniversity = req.headers['x-user-university'] as string;
      const { q, university, batch, page = 1, limit = 20 } = req.query;

      if (!q && !university && !batch) {
        res.status(400).json(ResponseUtils.error('Search query is required'));
        return;
      }

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 50); // Max 50 results
      const skip = (pageNum - 1) * limitNum;

      // Build search query
      const searchQuery: any = {
        isActive: true,
        _id: { $ne: currentUserId }, // Exclude current user
      };

      // Restrict search to same university by default
      searchQuery.university = university || currentUserUniversity;

      if (q) {
        const searchRegex = new RegExp(ValidationUtils.sanitizeInput(q as string), 'i');
        searchQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { username: searchRegex },
          { email: searchRegex }
        ];
      }

      if (batch) {
        searchQuery.batch = batch;
      }

      // Execute search
      const [users, total] = await Promise.all([
        User.find(searchQuery)
          .select('firstName lastName username email university batch course photo createdAt')
          .sort({ firstName: 1, lastName: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json(ResponseUtils.success({
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages
        }
      }, 'Users retrieved successfully'));

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json(ResponseUtils.error('Failed to search users'));
    }
  };

  // Get users by university and batch
  public getUsersByUniversityAndBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const currentUserId = req.headers['x-user-id'] as string;
      const { university, batch } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const skip = (page - 1) * limit;

      if (!university || !batch) {
        res.status(400).json(ResponseUtils.error('University and batch are required'));
        return;
      }

      const searchQuery = {
        university: ValidationUtils.sanitizeInput(university as string),
        batch: ValidationUtils.sanitizeInput(batch as string),
        isActive: true,
        _id: { $ne: currentUserId }
      };

      const [users, total] = await Promise.all([
        User.find(searchQuery)
          .select('firstName lastName username email university batch course photo privacySettings.allowFriendRequests')
          .sort({ firstName: 1, lastName: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json(ResponseUtils.success({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages
        }
      }, 'Users retrieved successfully'));

    } catch (error) {
      console.error('Get users by university and batch error:', error);
      res.status(500).json(ResponseUtils.error('Failed to retrieve users'));
    }
  };

  // Update privacy settings
  public updatePrivacySettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { showSchedule, showLocation, allowFriendRequests, showOnlineStatus } = req.body;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      const validShowOptions = ['public', 'friends', 'private'];

      // Validate settings
      if (showSchedule && !validShowOptions.includes(showSchedule)) {
        res.status(400).json(ResponseUtils.error('Invalid showSchedule value'));
        return;
      }

      if (showLocation && !validShowOptions.includes(showLocation)) {
        res.status(400).json(ResponseUtils.error('Invalid showLocation value'));
        return;
      }

      // Update privacy settings
      const updatedSettings = { ...user.privacySettings };
      
      if (showSchedule !== undefined) updatedSettings.showSchedule = showSchedule;
      if (showLocation !== undefined) updatedSettings.showLocation = showLocation;
      if (allowFriendRequests !== undefined) updatedSettings.allowFriendRequests = allowFriendRequests;
      if (showOnlineStatus !== undefined) updatedSettings.showOnlineStatus = showOnlineStatus;

      user.privacySettings = updatedSettings;
      await user.save();

      res.status(200).json(ResponseUtils.success(
        user.privacySettings,
        'Privacy settings updated successfully'
      ));

    } catch (error) {
      console.error('Update privacy settings error:', error);
      res.status(500).json(ResponseUtils.error('Failed to update privacy settings'));
    }
  };

  // Deactivate account
  public deactivateAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { password } = req.body;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      if (!password) {
        res.status(400).json(ResponseUtils.error('Password is required to deactivate account'));
        return;
      }

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json(ResponseUtils.error('Invalid password'));
        return;
      }

      // Deactivate user
      user.isActive = false;
      await user.save();

      res.status(200).json(ResponseUtils.success(null, 'Account deactivated successfully'));

    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json(ResponseUtils.error('Failed to deactivate account'));
    }
  };

  // Get user stats
  public getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json(ResponseUtils.error('User not found'));
        return;
      }

      // Basic stats - can be extended with data from other services
      const stats = {
        accountCreated: user.createdAt,
        lastLogin: user.lastLogin,
        emailVerified: user.isEmailVerified,
        university: user.university,
        batch: user.batch,
        course: user.course
      };

      res.status(200).json(ResponseUtils.success(stats, 'User stats retrieved successfully'));

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json(ResponseUtils.error('Failed to retrieve user stats'));
    }
  };
}
