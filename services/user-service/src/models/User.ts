import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IPrivacySettings } from '../../../../../shared/src/types';

// Privacy settings schema
const privacySettingsSchema = new Schema<IPrivacySettings>({
  showSchedule: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  },
  showLocation: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  },
  allowFriendRequests: {
    type: Boolean,
    default: true
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// User document interface extending MongoDB Document
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
  password: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    index: true,
    validate: {
      validator: function(username: string) {
        return /^[a-zA-Z0-9_]+$/.test(username);
      },
      message: 'Username can only contain letters, numbers, and underscores'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in query results by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  university: {
    type: String,
    required: [true, 'University is required'],
    trim: true,
    index: true,
    maxlength: [100, 'University name cannot exceed 100 characters']
  },
  batch: {
    type: String,
    required: [true, 'Batch/Year is required'],
    trim: true,
    maxlength: [20, 'Batch cannot exceed 20 characters']
  },
  course: {
    type: String,
    required: [true, 'Course/Program is required'],
    trim: true,
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  photo: {
    type: String,
    default: null,
    validate: {
      validator: function(photo: string) {
        if (!photo) return true;
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(photo);
      },
      message: 'Photo must be a valid image URL'
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  privacySettings: {
    type: privacySettingsSchema,
    default: () => ({})
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Indexes for better query performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ university: 1, batch: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre<IUserDocument>('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static method to find active users by university
userSchema.statics.findByUniversity = function(university: string) {
  return this.find({ university, isActive: true });
};

// Static method to find users by batch and university
userSchema.statics.findByUniversityAndBatch = function(university: string, batch: string) {
  return this.find({ university, batch, isActive: true });
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });

export const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;
