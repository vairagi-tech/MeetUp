import { apiClient } from './apiClient';

interface TimetableEntry {
  id: string;
  subject: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam' | 'other';
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  room?: string;
  instructor?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
}

interface FreeTimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  dayOfWeek: number;
  isAvailable: boolean;
}

interface CreateEntryData {
  subject: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'exam' | 'other';
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  room?: string;
  instructor?: string;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  };
}

class TimetableService {
  async getTimetable(params?: {
    startDate?: string;
    endDate?: string;
    dayOfWeek?: number;
  }): Promise<{
    entries: TimetableEntry[];
    groupedByDay: Record<number, TimetableEntry[]>;
    totalEntries: number;
  }> {
    const response = await apiClient.get('/timetables', { params });
    return response.data.data;
  }

  async createEntry(entryData: CreateEntryData): Promise<TimetableEntry> {
    const response = await apiClient.post('/timetables', entryData);
    return response.data.data;
  }

  async updateEntry(entryId: string, updates: Partial<CreateEntryData>): Promise<TimetableEntry> {
    const response = await apiClient.put(`/timetables/${entryId}`, updates);
    return response.data.data;
  }

  async deleteEntry(entryId: string): Promise<void> {
    await apiClient.delete(`/timetables/${entryId}`);
  }

  async getFreeTimeSlots(params: {
    startDate: string;
    endDate: string;
    workingHoursStart?: number;
    workingHoursEnd?: number;
    minDuration?: number;
  }): Promise<{
    freeTimeSlots: FreeTimeSlot[];
    groupedByDay: Record<string, FreeTimeSlot[]>;
    totalSlots: number;
    totalFreeHours: number;
  }> {
    const response = await apiClient.get('/timetables/free-time', { params });
    return response.data.data;
  }

  async findCommonFreeTime(data: {
    userIds: string[];
    startDate: string;
    endDate: string;
    minDuration?: number;
  }): Promise<{
    commonFreeTime: FreeTimeSlot[];
    suggestions: any[];
    participantCount: number;
    totalCommonHours: number;
  }> {
    const response = await apiClient.post('/timetables/common-free', data);
    return response.data.data;
  }

  async importTimetable(file: File, format: 'csv' | 'ics'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/timetables/import?format=${format}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async exportTimetable(format: 'csv' | 'ics' = 'ics'): Promise<Blob> {
    const response = await apiClient.get(`/timetables/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getTimetableStats(): Promise<{
    totalEntries: number;
    entriesByType: Record<string, number>;
    entriesByDay: Record<string, number>;
    weeklyHours: number;
  }> {
    const response = await apiClient.get('/timetables/stats');
    return response.data.data;
  }

  // Utility methods
  formatTime(time: string): string {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  getTypeColor(type: string): string {
    const colors = {
      lecture: 'blue',
      lab: 'green',
      tutorial: 'purple',
      exam: 'red',
      other: 'gray',
    };
    return colors[type as keyof typeof colors] || 'gray';
  }

  isTimeConflict(entry1: TimetableEntry, entry2: TimetableEntry): boolean {
    if (entry1.dayOfWeek !== entry2.dayOfWeek) return false;

    const start1 = new Date(entry1.startTime);
    const end1 = new Date(entry1.endTime);
    const start2 = new Date(entry2.startTime);
    const end2 = new Date(entry2.endTime);

    return (start1 < end2 && end1 > start2);
  }

  validateEntry(entry: CreateEntryData): string[] {
    const errors: string[] = [];

    if (!entry.subject?.trim()) {
      errors.push('Subject is required');
    }

    if (!entry.startTime || !entry.endTime) {
      errors.push('Start time and end time are required');
    }

    if (entry.startTime && entry.endTime) {
      const start = new Date(entry.startTime);
      const end = new Date(entry.endTime);
      
      if (end <= start) {
        errors.push('End time must be after start time');
      }

      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration < 15) {
        errors.push('Minimum duration is 15 minutes');
      }
      if (duration > 480) {
        errors.push('Maximum duration is 8 hours');
      }
    }

    if (entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
      errors.push('Invalid day of week');
    }

    return errors;
  }

  generateTimeSlots(startHour: number = 8, endHour: number = 22, interval: number = 30): string[] {
    const slots: string[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push(time.toTimeString().slice(0, 5));
      }
    }
    
    return slots;
  }
}

export const timetableService = new TimetableService();
