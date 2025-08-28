import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { IJWTPayload, IFreeTimeSlot, ITimetableEntry } from '../types';

export class HashUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export class JWTUtils {
  static generateToken(payload: Omit<IJWTPayload, 'iat' | 'exp'>, secret: string, expiresIn: string = '7d'): string {
    return jwt.sign(payload, secret, { expiresIn });
  }

  static verifyToken(token: string, secret: string): IJWTPayload {
    return jwt.verify(token, secret) as IJWTPayload;
  }

  static decodeToken(token: string): IJWTPayload | null {
    try {
      return jwt.decode(token) as IJWTPayload;
    } catch {
      return null;
    }
  }
}

export class TimeUtils {
  static calculateFreeTimeSlots(
    timetableEntries: ITimetableEntry[],
    startDate: Date,
    endDate: Date,
    workingHours: { start: number; end: number } = { start: 8, end: 22 }
  ): IFreeTimeSlot[] {
    const freeSlots: IFreeTimeSlot[] = [];
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Sort timetable entries by start time
    const sortedEntries = timetableEntries.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Iterate through each day in the date range
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setTime(currentDate.getTime() + dayInMs)) {
      const dayOfWeek = currentDate.getDay();
      const dayEntries = sortedEntries.filter(entry => entry.dayOfWeek === dayOfWeek);
      
      // Start with the beginning of working hours
      let currentTime = new Date(currentDate);
      currentTime.setHours(workingHours.start, 0, 0, 0);
      
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(workingHours.end, 0, 0, 0);

      // Find gaps between scheduled classes
      for (let i = 0; i <= dayEntries.length; i++) {
        let slotEnd: Date;
        
        if (i === dayEntries.length) {
          // Last slot - from current time to end of day
          slotEnd = endOfDay;
        } else {
          slotEnd = new Date(dayEntries[i].startTime);
        }

        if (currentTime < slotEnd) {
          const duration = (slotEnd.getTime() - currentTime.getTime()) / (1000 * 60);
          
          // Only include slots that are at least 30 minutes long
          if (duration >= 30) {
            freeSlots.push({
              startTime: new Date(currentTime),
              endTime: new Date(slotEnd),
              duration,
              dayOfWeek,
              isAvailable: true
            });
          }
        }

        // Move to the end of current class
        if (i < dayEntries.length) {
          currentTime = new Date(dayEntries[i].endTime);
        }
      }
    }

    return freeSlots;
  }

  static findCommonFreeSlots(userFreeSlots: IFreeTimeSlot[][]): IFreeTimeSlot[] {
    if (userFreeSlots.length === 0) return [];
    if (userFreeSlots.length === 1) return userFreeSlots[0];

    let commonSlots = userFreeSlots[0];

    // Find intersection of all user's free slots
    for (let i = 1; i < userFreeSlots.length; i++) {
      commonSlots = this.intersectFreeSlots(commonSlots, userFreeSlots[i]);
    }

    return commonSlots;
  }

  private static intersectFreeSlots(slots1: IFreeTimeSlot[], slots2: IFreeTimeSlot[]): IFreeTimeSlot[] {
    const intersections: IFreeTimeSlot[] = [];

    for (const slot1 of slots1) {
      for (const slot2 of slots2) {
        const overlapStart = new Date(Math.max(slot1.startTime.getTime(), slot2.startTime.getTime()));
        const overlapEnd = new Date(Math.min(slot1.endTime.getTime(), slot2.endTime.getTime()));

        if (overlapStart < overlapEnd) {
          const duration = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
          
          // Only include overlaps that are at least 30 minutes
          if (duration >= 30) {
            intersections.push({
              startTime: overlapStart,
              endTime: overlapEnd,
              duration,
              dayOfWeek: slot1.dayOfWeek,
              isAvailable: true
            });
          }
        }
      }
    }

    return intersections;
  }

  static formatTimeSlot(slot: IFreeTimeSlot): string {
    const start = moment(slot.startTime).format('HH:mm');
    const end = moment(slot.endTime).format('HH:mm');
    const day = moment(slot.startTime).format('dddd');
    return `${day} ${start}-${end} (${slot.duration}min)`;
  }

  static isWithinTimeRange(time: Date, start: string, end: string): boolean {
    const timeStr = moment(time).format('HH:mm');
    return timeStr >= start && timeStr <= end;
  }

  static getWeekDates(date: Date = new Date()): { start: Date; end: Date } {
    const start = moment(date).startOf('week').toDate();
    const end = moment(date).endOf('week').toDate();
    return { start, end };
  }
}

export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static isValidUniversityEmail(email: string, universityDomain?: string): boolean {
    if (!this.isValidEmail(email)) return false;
    
    if (universityDomain) {
      return email.endsWith(`@${universityDomain}`);
    }
    
    // Common university email patterns
    const universityPatterns = [
      /\.edu$/,
      /\.ac\./,
      /university\./,
      /college\./
    ];
    
    return universityPatterns.some(pattern => pattern.test(email));
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>\"']/g, '');
  }

  static isValidCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}

export class LocationUtils {
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static isWithinRadius(
    userLat: number,
    userLng: number,
    targetLat: number,
    targetLng: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLng, targetLat, targetLng);
    return distance <= radiusKm;
  }

  static findNearbyUsers(
    currentUser: { lat: number; lng: number },
    users: Array<{ id: string; lat: number; lng: number }>,
    radiusKm: number = 1
  ): Array<{ id: string; distance: number }> {
    return users
      .map(user => ({
        id: user.id,
        distance: this.calculateDistance(currentUser.lat, currentUser.lng, user.lat, user.lng)
      }))
      .filter(user => user.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }
}

export class ArrayUtils {
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static intersection<T>(arr1: T[], arr2: T[]): T[] {
    return arr1.filter(value => arr2.includes(value));
  }

  static difference<T>(arr1: T[], arr2: T[]): T[] {
    return arr1.filter(value => !arr2.includes(value));
  }
}

export class CacheUtils {
  private static cache = new Map<string, { data: any; expiry: number }>();

  static set(key: string, data: any, ttlMs: number = 300000): void { // Default 5 minutes
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data, expiry });
  }

  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

export class ResponseUtils {
  static success<T>(data?: T, message: string = 'Success'): { success: boolean; message: string; data?: T } {
    return {
      success: true,
      message,
      data
    };
  }

  static error(message: string, error?: string): { success: boolean; message: string; error?: string } {
    return {
      success: false,
      message,
      error
    };
  }
}

export { moment };
