import { Request, Response } from 'express';
import { Timetable, ITimetableDocument } from '../models/Timetable';
import { TimeUtils, ResponseUtils, ValidationUtils } from '../../../../../shared/src/utils';
import { IFreeTimeSlot } from '../../../../../shared/src/types';
import { TimetableImportService } from '../services/timetableImportService';
import { FreeTimeService } from '../services/freeTimeService';

export class TimetableController {
  private importService: TimetableImportService;
  private freeTimeService: FreeTimeService;

  constructor() {
    this.importService = new TimetableImportService();
    this.freeTimeService = new FreeTimeService();
  }

  // Create new timetable entry
  public createEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const {
        subject,
        type,
        startTime,
        endTime,
        dayOfWeek,
        room,
        instructor,
        isRecurring,
        recurringPattern
      } = req.body;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      // Validate time overlap with existing entries
      const existingEntries = await Timetable.findByUserAndDay(userId, dayOfWeek);
      const newStartTime = new Date(startTime);
      const newEndTime = new Date(endTime);

      for (const entry of existingEntries) {
        const entryStart = new Date(entry.startTime);
        const entryEnd = new Date(entry.endTime);

        // Check for time overlap
        if (
          (newStartTime < entryEnd && newEndTime > entryStart) ||
          (entryStart < newEndTime && entryEnd > newStartTime)
        ) {
          res.status(409).json(ResponseUtils.error(
            `Time slot conflicts with existing entry: ${entry.subject} (${entry.timeDisplay})`
          ));
          return;
        }
      }

      // Create new entry
      const entry = new Timetable({
        userId,
        subject: ValidationUtils.sanitizeInput(subject),
        type,
        startTime: newStartTime,
        endTime: newEndTime,
        dayOfWeek,
        room: room ? ValidationUtils.sanitizeInput(room) : undefined,
        instructor: instructor ? ValidationUtils.sanitizeInput(instructor) : undefined,
        isRecurring,
        recurringPattern: isRecurring ? recurringPattern : undefined
      });

      await entry.save();

      res.status(201).json(ResponseUtils.success(
        entry.toJSON(),
        'Timetable entry created successfully'
      ));

    } catch (error) {
      console.error('Create timetable entry error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json(ResponseUtils.error(validationErrors[0]));
        return;
      }

      res.status(500).json(ResponseUtils.error('Failed to create timetable entry'));
    }
  };

  // Get user's timetable
  public getUserTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { startDate, endDate, dayOfWeek } = req.query;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      let entries: ITimetableDocument[];

      if (dayOfWeek !== undefined) {
        // Get entries for specific day
        const day = parseInt(dayOfWeek as string);
        entries = await Timetable.findByUserAndDay(userId, day);
      } else if (startDate && endDate) {
        // Get entries for date range
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        entries = await Timetable.findByUserAndDateRange(userId, start, end);
      } else {
        // Get all entries
        entries = await Timetable.find({ userId }).sort({ dayOfWeek: 1, startTime: 1 });
      }

      // Group entries by day of week
      const groupedEntries = entries.reduce((acc, entry) => {
        if (!acc[entry.dayOfWeek]) {
          acc[entry.dayOfWeek] = [];
        }
        acc[entry.dayOfWeek].push(entry.toJSON());
        return acc;
      }, {} as Record<number, any[]>);

      res.status(200).json(ResponseUtils.success({
        entries: entries.map(entry => entry.toJSON()),
        groupedByDay: groupedEntries,
        totalEntries: entries.length
      }, 'Timetable retrieved successfully'));

    } catch (error) {
      console.error('Get user timetable error:', error);
      res.status(500).json(ResponseUtils.error('Failed to retrieve timetable'));
    }
  };

  // Update timetable entry
  public updateEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { entryId } = req.params;
      const updateData = req.body;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      const entry = await Timetable.findOne({ _id: entryId, userId });
      if (!entry) {
        res.status(404).json(ResponseUtils.error('Timetable entry not found'));
        return;
      }

      // If updating time, check for conflicts
      if (updateData.startTime || updateData.endTime || updateData.dayOfWeek) {
        const newStartTime = new Date(updateData.startTime || entry.startTime);
        const newEndTime = new Date(updateData.endTime || entry.endTime);
        const newDayOfWeek = updateData.dayOfWeek !== undefined ? updateData.dayOfWeek : entry.dayOfWeek;

        const existingEntries = await Timetable.find({
          userId,
          dayOfWeek: newDayOfWeek,
          _id: { $ne: entryId } // Exclude current entry
        });

        for (const existingEntry of existingEntries) {
          const entryStart = new Date(existingEntry.startTime);
          const entryEnd = new Date(existingEntry.endTime);

          if (
            (newStartTime < entryEnd && newEndTime > entryStart) ||
            (entryStart < newEndTime && entryEnd > newStartTime)
          ) {
            res.status(409).json(ResponseUtils.error(
              `Time slot conflicts with existing entry: ${existingEntry.subject}`
            ));
            return;
          }
        }
      }

      // Update entry
      Object.keys(updateData).forEach(key => {
        if (key === 'subject' || key === 'room' || key === 'instructor') {
          entry[key] = updateData[key] ? ValidationUtils.sanitizeInput(updateData[key]) : updateData[key];
        } else {
          entry[key] = updateData[key];
        }
      });

      await entry.save();

      res.status(200).json(ResponseUtils.success(
        entry.toJSON(),
        'Timetable entry updated successfully'
      ));

    } catch (error) {
      console.error('Update timetable entry error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json(ResponseUtils.error(validationErrors[0]));
        return;
      }

      res.status(500).json(ResponseUtils.error('Failed to update timetable entry'));
    }
  };

  // Delete timetable entry
  public deleteEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { entryId } = req.params;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      const entry = await Timetable.findOneAndDelete({ _id: entryId, userId });
      if (!entry) {
        res.status(404).json(ResponseUtils.error('Timetable entry not found'));
        return;
      }

      res.status(200).json(ResponseUtils.success(null, 'Timetable entry deleted successfully'));

    } catch (error) {
      console.error('Delete timetable entry error:', error);
      res.status(500).json(ResponseUtils.error('Failed to delete timetable entry'));
    }
  };

  // Calculate free time slots
  public getFreeTimeSlots = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { 
        startDate, 
        endDate, 
        workingHoursStart = 8, 
        workingHoursEnd = 22,
        minDuration = 30 
      } = req.query;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json(ResponseUtils.error('Start date and end date are required'));
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const minDurationNum = parseInt(minDuration as string);

      // Get user's timetable entries
      const entries = await Timetable.findByUserAndDateRange(userId, start, end);

      // Calculate free time slots
      const freeSlots = TimeUtils.calculateFreeTimeSlots(
        entries.map(entry => ({
          _id: entry._id.toString(),
          userId: entry.userId,
          subject: entry.subject,
          type: entry.type,
          startTime: entry.startTime,
          endTime: entry.endTime,
          dayOfWeek: entry.dayOfWeek,
          room: entry.room,
          instructor: entry.instructor,
          isRecurring: entry.isRecurring,
          recurringPattern: entry.recurringPattern,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        })),
        start,
        end,
        { start: parseInt(workingHoursStart as string), end: parseInt(workingHoursEnd as string) }
      );

      // Filter by minimum duration
      const filteredSlots = freeSlots.filter(slot => slot.duration >= minDurationNum);

      // Group by day
      const groupedSlots = filteredSlots.reduce((acc, slot) => {
        const dayKey = slot.startTime.toDateString();
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(slot);
        return acc;
      }, {} as Record<string, IFreeTimeSlot[]>);

      res.status(200).json(ResponseUtils.success({
        freeTimeSlots: filteredSlots,
        groupedByDay: groupedSlots,
        totalSlots: filteredSlots.length,
        totalFreeHours: filteredSlots.reduce((total, slot) => total + (slot.duration / 60), 0)
      }, 'Free time slots calculated successfully'));

    } catch (error) {
      console.error('Get free time slots error:', error);
      res.status(500).json(ResponseUtils.error('Failed to calculate free time slots'));
    }
  };

  // Find common free time with other users
  public findCommonFreeTime = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { userIds, startDate, endDate, minDuration = 30 } = req.body;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json(ResponseUtils.error('User IDs array is required'));
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json(ResponseUtils.error('Start date and end date are required'));
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const allUserIds = [userId, ...userIds];

      // Get all users' timetables
      const allUserFreeSlots: IFreeTimeSlot[][] = [];

      for (const uid of allUserIds) {
        const entries = await Timetable.findByUserAndDateRange(uid, start, end);
        const freeSlots = TimeUtils.calculateFreeTimeSlots(
          entries.map(entry => ({
            _id: entry._id.toString(),
            userId: entry.userId,
            subject: entry.subject,
            type: entry.type,
            startTime: entry.startTime,
            endTime: entry.endTime,
            dayOfWeek: entry.dayOfWeek,
            room: entry.room,
            instructor: entry.instructor,
            isRecurring: entry.isRecurring,
            recurringPattern: entry.recurringPattern,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt
          })),
          start,
          end
        );
        allUserFreeSlots.push(freeSlots);
      }

      // Find common free slots
      const commonSlots = TimeUtils.findCommonFreeSlots(allUserFreeSlots);
      const filteredCommonSlots = commonSlots.filter(slot => slot.duration >= parseInt(minDuration));

      // Generate meeting suggestions
      const suggestions = this.freeTimeService.generateMeetingSuggestions(
        filteredCommonSlots,
        allUserIds
      );

      res.status(200).json(ResponseUtils.success({
        commonFreeTime: filteredCommonSlots,
        suggestions,
        participantCount: allUserIds.length,
        totalCommonHours: filteredCommonSlots.reduce((total, slot) => total + (slot.duration / 60), 0)
      }, 'Common free time found successfully'));

    } catch (error) {
      console.error('Find common free time error:', error);
      res.status(500).json(ResponseUtils.error('Failed to find common free time'));
    }
  };

  // Import timetable from file
  public importTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { format } = req.query;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      if (!req.file) {
        res.status(400).json(ResponseUtils.error('File is required'));
        return;
      }

      let importResult;

      switch (format) {
        case 'csv':
          importResult = await this.importService.importFromCSV(req.file.buffer, userId);
          break;
        case 'ics':
          importResult = await this.importService.importFromICS(req.file.buffer, userId);
          break;
        default:
          res.status(400).json(ResponseUtils.error('Unsupported format. Supported formats: csv, ics'));
          return;
      }

      res.status(200).json(ResponseUtils.success(importResult, 'Timetable imported successfully'));

    } catch (error) {
      console.error('Import timetable error:', error);
      res.status(500).json(ResponseUtils.error('Failed to import timetable'));
    }
  };

  // Export timetable
  public exportTimetable = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { format = 'ics' } = req.query;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      const entries = await Timetable.find({ userId });

      let exportData;
      let contentType: string;
      let filename: string;

      switch (format) {
        case 'ics':
          exportData = await this.importService.exportToICS(entries);
          contentType = 'text/calendar';
          filename = 'timetable.ics';
          break;
        case 'csv':
          exportData = await this.importService.exportToCSV(entries);
          contentType = 'text/csv';
          filename = 'timetable.csv';
          break;
        default:
          res.status(400).json(ResponseUtils.error('Unsupported format. Supported formats: csv, ics'));
          return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(exportData);

    } catch (error) {
      console.error('Export timetable error:', error);
      res.status(500).json(ResponseUtils.error('Failed to export timetable'));
    }
  };

  // Get timetable statistics
  public getTimetableStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(401).json(ResponseUtils.error('User ID not found in request'));
        return;
      }

      const [
        totalEntries,
        entriesByType,
        entriesByDay,
        weeklyHours
      ] = await Promise.all([
        Timetable.countDocuments({ userId }),
        Timetable.aggregate([
          { $match: { userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        Timetable.aggregate([
          { $match: { userId } },
          { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),
        Timetable.aggregate([
          { $match: { userId } },
          {
            $addFields: {
              duration: {
                $divide: [
                  { $subtract: ['$endTime', '$startTime'] },
                  1000 * 60 * 60 // Convert to hours
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              totalHours: { $sum: '$duration' }
            }
          }
        ])
      ]);

      const stats = {
        totalEntries,
        entriesByType: entriesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        entriesByDay: entriesByDay.reduce((acc, item) => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          acc[dayNames[item._id]] = item.count;
          return acc;
        }, {}),
        weeklyHours: weeklyHours.length > 0 ? Math.round(weeklyHours[0].totalHours * 100) / 100 : 0
      };

      res.status(200).json(ResponseUtils.success(stats, 'Timetable statistics retrieved successfully'));

    } catch (error) {
      console.error('Get timetable stats error:', error);
      res.status(500).json(ResponseUtils.error('Failed to retrieve timetable statistics'));
    }
  };
}
