import mongoose, { Schema, Document } from 'mongoose';
import { IGroup, IGroupMember } from '../../../../../shared/src/types';

// Group member schema
const groupMemberSchema = new Schema<IGroupMember>({
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Group document interface
export interface IGroupDocument extends Omit<IGroup, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Group schema
const groupSchema = new Schema<IGroupDocument>({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required'],
    index: true
  },
  members: {
    type: [groupMemberSchema],
    validate: {
      validator: function(members: IGroupMember[]) {
        return members.length > 0;
      },
      message: 'Group must have at least one member'
    }
  },
  isPrivate: {
    type: Boolean,
    default: false,
    index: true
  },
  groupType: {
    type: String,
    enum: ['study', 'social', 'project', 'sports', 'other'],
    default: 'study',
    index: true
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

// Indexes
groupSchema.index({ createdBy: 1 });
groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ isPrivate: 1, groupType: 1 });
groupSchema.index({ createdAt: -1 });

// Virtual for active member count
groupSchema.virtual('activeMemberCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Static methods
groupSchema.statics.findByMember = function(userId: string) {
  return this.find({
    'members.userId': userId,
    'members.isActive': true
  });
};

groupSchema.statics.findPublicGroups = function(groupType?: string, page: number = 1, limit: number = 20) {
  const query: any = { isPrivate: false };
  if (groupType) {
    query.groupType = groupType;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance methods
groupSchema.methods.addMember = function(userId: string, role: 'admin' | 'member' = 'member') {
  const existingMember = this.members.find(member => member.userId === userId);
  
  if (existingMember) {
    if (!existingMember.isActive) {
      existingMember.isActive = true;
      existingMember.role = role;
      existingMember.joinedAt = new Date();
    }
    return existingMember;
  }

  const newMember: IGroupMember = {
    userId,
    role,
    joinedAt: new Date(),
    isActive: true
  };
  
  this.members.push(newMember);
  return newMember;
};

groupSchema.methods.removeMember = function(userId: string) {
  const memberIndex = this.members.findIndex(member => member.userId === userId);
  
  if (memberIndex === -1) {
    throw new Error('Member not found in group');
  }
  
  // Don't allow removing the only admin
  const member = this.members[memberIndex];
  if (member.role === 'admin') {
    const activeAdmins = this.members.filter(m => m.role === 'admin' && m.isActive);
    if (activeAdmins.length === 1) {
      throw new Error('Cannot remove the last admin from group');
    }
  }
  
  this.members.splice(memberIndex, 1);
  return member;
};

groupSchema.methods.updateMemberRole = function(userId: string, newRole: 'admin' | 'member') {
  const member = this.members.find(m => m.userId === userId && m.isActive);
  
  if (!member) {
    throw new Error('Member not found in group');
  }
  
  // Don't allow removing the only admin
  if (member.role === 'admin' && newRole === 'member') {
    const activeAdmins = this.members.filter(m => m.role === 'admin' && m.isActive);
    if (activeAdmins.length === 1) {
      throw new Error('Cannot demote the last admin');
    }
  }
  
  member.role = newRole;
  return member;
};

groupSchema.methods.isAdmin = function(userId: string): boolean {
  const member = this.members.find(m => m.userId === userId && m.isActive);
  return member ? member.role === 'admin' : false;
};

groupSchema.methods.isMember = function(userId: string): boolean {
  const member = this.members.find(m => m.userId === userId && m.isActive);
  return !!member;
};

groupSchema.methods.getMember = function(userId: string): IGroupMember | undefined {
  return this.members.find(m => m.userId === userId && m.isActive);
};

groupSchema.methods.getActiveMembers = function(): IGroupMember[] {
  return this.members.filter(m => m.isActive);
};

// Ensure virtuals are included in JSON output
groupSchema.set('toJSON', { virtuals: true });

export const Group = mongoose.model<IGroupDocument>('Group', groupSchema);
export default Group;
