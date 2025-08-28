export interface IUser {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  university: string;
  batch: string;
  course: string;
  photo?: string;
  isEmailVerified: boolean;
  privacySettings: IPrivacySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrivacySettings {
  showSchedule: 'public' | 'friends' | 'private';
  showLocation: 'public' | 'friends' | 'private';
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
}

export interface ITimetableEntry {
  _id: string;
  userId: string;
  subject: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam' | 'other';
  startTime: Date;
  endTime: Date;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  room?: string;
  instructor?: string;
  isRecurring: boolean;
  recurringPattern?: IRecurringPattern;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecurringPattern {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
}

export interface IFreeTimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  dayOfWeek: number;
  isAvailable: boolean;
}

export interface IFriend {
  _id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  requestedBy: string;
  requestedAt: Date;
  acceptedAt?: Date;
}

export interface IGroup {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: IGroupMember[];
  isPrivate: boolean;
  groupType: 'study' | 'social' | 'project' | 'sports' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

export interface ILocation {
  _id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  isActive: boolean;
  place?: string;
  building?: string;
}

export interface IEvent {
  _id: string;
  title: string;
  description?: string;
  type: 'university' | 'club' | 'social' | 'academic' | 'sports';
  startTime: Date;
  endTime: Date;
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  organizer: string;
  attendees: string[];
  maxAttendees?: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: string;
  userId: string;
  type: 'friend_request' | 'group_invite' | 'event_reminder' | 'free_time_alert' | 'proximity_alert';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt?: Date;
}

export interface ICommonFreeTime {
  users: string[];
  freeTimeSlots: IFreeTimeSlot[];
  suggestedMeetings: ISuggestedMeeting[];
}

export interface ISuggestedMeeting {
  startTime: Date;
  endTime: Date;
  duration: number;
  location?: {
    name: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  confidence: number; // 0-1
  participants: string[];
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface IJWTPayload {
  userId: string;
  email: string;
  university: string;
  iat: number;
  exp: number;
}

export interface IServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

// WebSocket Events
export interface ISocketEvents {
  // User events
  'user:online': { userId: string };
  'user:offline': { userId: string };
  
  // Location events
  'location:update': { userId: string; location: ILocation };
  'location:nearby': { users: string[] };
  
  // Notification events
  'notification:new': INotification;
  'notification:read': { notificationId: string };
  
  // Free time events
  'freetime:found': { users: string[]; slots: IFreeTimeSlot[] };
  
  // Group events
  'group:invite': { groupId: string; inviterId: string };
  'group:joined': { groupId: string; userId: string };
}

export type TimeSlot = {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type UniversityConfig = {
  name: string;
  apiEndpoint?: string;
  authMethod: 'oauth' | 'api_key' | 'manual';
  supportedFormats: Array<'api' | 'csv' | 'ics' | 'manual'>;
  timeZone: string;
};

// Error types
export class CustomError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}
