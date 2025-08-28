import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUserDocument } from '../models/User';
import { ValidationUtils, JWTUtils, HashUtils, ResponseUtils } from '../../../../../shared/src/utils';
import { ValidationError, AuthenticationError } from '../../../../../shared/src/types';
import { EmailService } from '../services/emailService';

export class AuthController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Register new user
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        username,
        password,
        firstName,
        lastName,
        university,
        batch,
        course
      } = req.body;

      // Validation
      if (!email || !username || !password || !firstName || !lastName || !university || !batch || !course) {
        res.status(400).json(ResponseUtils.error('All fields are required'));
        return;
      }

      if (!ValidationUtils.isValidEmail(email)) {
        res.status(400).json(ResponseUtils.error('Invalid email format'));
        return;
      }

      if (!ValidationUtils.isValidPassword(password)) {
        res.status(400).json(ResponseUtils.error(
          'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'
        ));
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      });

      if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
          res.status(409).json(ResponseUtils.error('Email already registered'));
          return;
        }
        if (existingUser.username === username.toLowerCase()) {
          res.status(409).json(ResponseUtils.error('Username already taken'));
          return;
        }
      }

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password,
        firstName: ValidationUtils.sanitizeInput(firstName),
        lastName: ValidationUtils.sanitizeInput(lastName),
        university: ValidationUtils.sanitizeInput(university),
        batch: ValidationUtils.sanitizeInput(batch),
        course: ValidationUtils.sanitizeInput(course),
        emailVerificationToken,
        isEmailVerified: false
      });

      await user.save();

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(
          user.email,
          user.firstName,
          emailVerificationToken
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email sending fails
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const token = JWTUtils.generateToken({
        userId: user._id.toString(),
        email: user.email,
        university: user.university
      }, jwtSecret);

      // Return user data without sensitive fields
      const userData = user.toJSON();
      delete (userData as any).password;

      res.status(201).json(ResponseUtils.success({
        user: userData,
        token,
        message: 'Registration successful! Please check your email to verify your account.'
      }, 'User registered successfully'));

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.code === 11000) {
        // Duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        res.status(409).json(ResponseUtils.error(`${field} already exists`));
        return;
      }

      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json(ResponseUtils.error(validationErrors[0]));
        return;
      }

      res.status(500).json(ResponseUtils.error('Registration failed', 'REGISTRATION_ERROR'));
    }
  };

  // Login user
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json(ResponseUtils.error('Email and password are required'));
        return;
      }

      // Find user with password field
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      }).select('+password');

      if (!user) {
        res.status(401).json(ResponseUtils.error('Invalid email or password'));
        return;
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json(ResponseUtils.error('Invalid email or password'));
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const token = JWTUtils.generateToken({
        userId: user._id.toString(),
        email: user.email,
        university: user.university
      }, jwtSecret);

      // Return user data without password
      const userData = user.toJSON();

      res.status(200).json(ResponseUtils.success({
        user: userData,
        token
      }, 'Login successful'));

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(ResponseUtils.error('Login failed', 'LOGIN_ERROR'));
    }
  };

  // Verify email
  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json(ResponseUtils.error('Verification token is required'));
        return;
      }

      // Find user with verification token
      const user = await User.findOne({
        emailVerificationToken: token,
        isActive: true
      }).select('+emailVerificationToken');

      if (!user) {
        res.status(400).json(ResponseUtils.error('Invalid or expired verification token'));
        return;
      }

      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      res.status(200).json(ResponseUtils.success(null, 'Email verified successfully'));

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json(ResponseUtils.error('Email verification failed', 'VERIFICATION_ERROR'));
    }
  };

  // Forgot password
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json(ResponseUtils.error('Email is required'));
        return;
      }

      const user = await User.findOne({
        email: email.toLowerCase(),
        isActive: true
      });

      // Always return success to prevent email enumeration
      if (!user) {
        res.status(200).json(ResponseUtils.success(null, 
          'If an account with that email exists, a password reset link has been sent.'));
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpiry;
      await user.save();

      // Send reset email
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.firstName,
          resetToken
        );
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      res.status(200).json(ResponseUtils.success(null, 
        'If an account with that email exists, a password reset link has been sent.'));

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json(ResponseUtils.error('Failed to process password reset request'));
    }
  };

  // Reset password
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json(ResponseUtils.error('Token and new password are required'));
        return;
      }

      if (!ValidationUtils.isValidPassword(password)) {
        res.status(400).json(ResponseUtils.error(
          'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number'
        ));
        return;
      }

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        isActive: true
      }).select('+passwordResetToken +passwordResetExpires');

      if (!user) {
        res.status(400).json(ResponseUtils.error('Invalid or expired reset token'));
        return;
      }

      // Update password and clear reset fields
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      res.status(200).json(ResponseUtils.success(null, 'Password reset successful'));

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json(ResponseUtils.error('Password reset failed'));
    }
  };

  // Refresh token
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(ResponseUtils.error('No token provided'));
        return;
      }

      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      try {
        const decoded = JWTUtils.verifyToken(token, jwtSecret);
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
          res.status(401).json(ResponseUtils.error('User no longer exists'));
          return;
        }

        // Generate new token
        const newToken = JWTUtils.generateToken({
          userId: user._id.toString(),
          email: user.email,
          university: user.university
        }, jwtSecret);

        res.status(200).json(ResponseUtils.success({
          token: newToken,
          user: user.toJSON()
        }, 'Token refreshed successfully'));

      } catch (jwtError) {
        res.status(401).json(ResponseUtils.error('Invalid token'));
        return;
      }

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json(ResponseUtils.error('Token refresh failed'));
    }
  };

  // Logout (client-side handles token removal)
  public logout = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(ResponseUtils.success(null, 'Logged out successfully'));
  };

  // Get current user profile
  public getProfile = async (req: Request, res: Response): Promise<void> => {
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

      res.status(200).json(ResponseUtils.success(user.toJSON(), 'Profile retrieved successfully'));

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(ResponseUtils.error('Failed to retrieve profile'));
    }
  };
}
