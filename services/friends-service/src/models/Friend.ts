import mongoose, { Schema, Document } from 'mongoose';
import { IFriend } from '../../../../../shared/src/types';

// Friend document interface
export interface IFriendDocument extends Omit<IFriend, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Friend schema
const friendSchema = new Schema<IFriendDocument>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  friendId: {
    type: String,
    required: [true, 'Friend ID is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending',
    index: true
  },
  requestedBy: {
    type: String,
    required: [true, 'Requester ID is required']
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  acceptedAt: {
    type: Date
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

// Compound indexes
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });
friendSchema.index({ userId: 1, status: 1 });
friendSchema.index({ friendId: 1, status: 1 });

// Static methods
friendSchema.statics.findFriendship = function(userId: string, friendId: string) {
  return this.findOne({
    $or: [
      { userId, friendId },
      { userId: friendId, friendId: userId }
    ]
  });
};

friendSchema.statics.getFriends = function(userId: string) {
  return this.find({
    $or: [
      { userId, status: 'accepted' },
      { friendId: userId, status: 'accepted' }
    ]
  });
};

friendSchema.statics.getPendingRequests = function(userId: string) {
  return this.find({
    friendId: userId,
    status: 'pending'
  });
};

friendSchema.statics.getSentRequests = function(userId: string) {
  return this.find({
    userId,
    status: 'pending'
  });
};

// Instance methods
friendSchema.methods.getOtherUserId = function(currentUserId: string): string {
  return this.userId === currentUserId ? this.friendId : this.userId;
};

export const Friend = mongoose.model<IFriendDocument>('Friend', friendSchema);
export default Friend;
