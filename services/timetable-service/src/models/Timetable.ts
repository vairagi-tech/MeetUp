import mongoose, { Schema, Document } from 'mongoose';
import { ITimetableEntry, IRecurringPattern } from '../../../../../shared/src/types';

// Recurring pattern schema
const recurringPatternSchema = new Schema<IRecurringPattern>({
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    required: true
  },
  interval: {
    type: Number,
    required: true,
    min: 1
  },
  endDate: {
    type: Date
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }]
}, { _id: false });

// Timetable entry document interface
export interface ITimetableDocument extends Omit<ITimetableEntry, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Timetable entry schema
const timetableSchema = new Schema<ITimetableDocument>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'exam', 'other'],
    required: [true, 'Class type is required'],
    default: 'lecture'
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function(endTime: Date) {
        return endTime > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  dayOfWeek: {
    type: Number,
    required: [true, 'Day of week is required'],
    min: [0, 'Day of week must be between 0-6 (Sunday-Saturday)'],
    max: [6, 'Day of week must be between 0-6 (Sunday-Saturday)'],
    index: true
  },
  room: {
    type: String,
    trim: true,
    maxlength: [50, 'Room name cannot exceed 50 characters']
  },
  instructor: {
    type: String,
    trim: true,
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  isRecurring: {
    type: Boolean,
    default: false,
    index: true
  },
  recurringPattern: {
    type: recurringPatternSchema,
    required: function() {
      return this.isRecurring;
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient queries
timetableSchema.index({ userId: 1, dayOfWeek: 1, startTime: 1 });
timetableSchema.index({ userId: 1, isRecurring: 1 });
timetableSchema.index({ userId: 1, type: 1 });

// Static method to find user's timetable for a specific day
timetableSchema.statics.findByUserAndDay = function(userId: string, dayOfWeek: number) {
  return this.find({ userId, dayOfWeek }).sort({ startTime: 1 });
};

// Static method to find user's timetable for a date range
timetableSchema.statics.findByUserAndDateRange = function(userId: string, startDate: Date, endDate: Date) {
  return this.find({
    userId,
    $or: [
      // Non-recurring entries within date range
      {
        isRecurring: false,
        startTime: { $gte: startDate, $lte: endDate }
      },
      // Recurring entries that might fall within date range
      {
        isRecurring: true,
        $or: [
          { 'recurringPattern.endDate': { $exists: false } },
          { 'recurringPattern.endDate': { $gte: startDate } }
        ]
      }
    ]
  }).sort({ dayOfWeek: 1, startTime: 1 });
};

// Virtual for duration in minutes
timetableSchema.virtual('durationMinutes').get(function() {
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
});

// Virtual for time display
timetableSchema.virtual('timeDisplay').get(function() {
  const startTime = this.startTime.toTimeString().slice(0, 5);
  const endTime = this.endTime.toTimeString().slice(0, 5);
  return `${startTime} - ${endTime}`;
});

// Virtual for day name
timetableSchema.virtual('dayName').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[this.dayOfWeek];
});

// Pre-save middleware for validation
timetableSchema.pre<ITimetableDocument>('save', function(next) {
  // Ensure start time is before end time
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
    return;
  }

  // Validate recurring pattern if recurring
  if (this.isRecurring && !this.recurringPattern) {
    next(new Error('Recurring pattern is required for recurring entries'));
    return;
  }

  next();
});

// Instance method to check if entry occurs on a specific date
timetableSchema.methods.occursOnDate = function(date: Date): boolean {
  const entryDate = new Date(this.startTime);
  
  if (!this.isRecurring) {
    return entryDate.toDateString() === date.toDateString();
  }

  // For recurring entries, check if date matches pattern
  const pattern = this.recurringPattern;
  if (!pattern) return false;

  // Check if date is after recurring pattern end date
  if (pattern.endDate && date > pattern.endDate) {
    return false;
  }

  // Check day of week matches
  if (date.getDay() !== this.dayOfWeek) {
    return false;
  }

  // Calculate weeks difference
  const weeksDiff = Math.floor((date.getTime() - entryDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  switch (pattern.frequency) {
    case 'weekly':
      return weeksDiff >= 0 && weeksDiff % pattern.interval === 0;
    case 'biweekly':
      return weeksDiff >= 0 && weeksDiff % (2 * pattern.interval) === 0;
    case 'monthly':
      // Simplified monthly check - could be enhanced
      return weeksDiff >= 0 && weeksDiff % (4 * pattern.interval) === 0;
    default:
      return false;
  }
};

// Ensure virtuals are included in JSON output
timetableSchema.set('toJSON', { virtuals: true });

export const Timetable = mongoose.model<ITimetableDocument>('Timetable', timetableSchema);
export default Timetable;
