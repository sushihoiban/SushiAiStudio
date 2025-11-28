
import { DaySchedule } from '../types';

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (minutes: number): string => {
  // Handle wrap around 24h
  let mAdjusted = minutes;
  while (mAdjusted >= 1440) {
    mAdjusted -= 1440;
  }
  const h = Math.floor(mAdjusted / 60);
  const m = mAdjusted % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const generateTimeSlots = (
  dateStr: string, 
  schedule: DaySchedule[] | undefined, 
  durationMinutes: number = 90,
  isAdmin: boolean = false
): { lunch: string[], dinner: string[] } => {
  
  const dateObj = new Date(dateStr);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const daySchedule = schedule?.find(s => s.day === dayName);

  // Default fallback if no schedule exists
  if (!daySchedule || !daySchedule.isOpen) {
    return { lunch: [], dinner: [] };
  }

  const openM = timeToMinutes(daySchedule.openTime);
  let closeM = timeToMinutes(daySchedule.closeTime);
  
  // Handle overnight schedule (e.g. Open 11:30, Close 02:00)
  if (closeM < openM) {
    closeM += 1440; // Add 24 hours
  }

  const breakStartM = daySchedule.hasBreak ? timeToMinutes(daySchedule.breakStart) : -1;
  const breakEndM = daySchedule.hasBreak ? timeToMinutes(daySchedule.breakEnd) : -1;

  // Adjust break times if they fall after midnight in an overnight schedule
  let adjBreakStart = breakStartM;
  let adjBreakEnd = breakEndM;
  
  if (daySchedule.hasBreak && closeM > 1440) {
      if (adjBreakStart < openM && adjBreakStart !== -1) adjBreakStart += 1440;
      if (adjBreakEnd < openM && adjBreakEnd !== -1) adjBreakEnd += 1440;
  }

  const lastSeatingM = closeM - durationMinutes;

  const slots: string[] = [];
  let currentM = openM;
  
  while (currentM <= lastSeatingM) {
    // Check break overlap
    if (daySchedule.hasBreak) {
      const bookingEnd = currentM + durationMinutes;
      
      // Strict break logic: Booking cannot START inside break, AND cannot END inside break (overlap)
      const startsInBreak = currentM >= adjBreakStart && currentM < adjBreakEnd;
      // Allow ending exactly AT break start? Yes. bookingEnd > breakStart means overlap
      const overlapsBreak = currentM < adjBreakStart && bookingEnd > adjBreakStart;

      if (startsInBreak) {
        currentM = adjBreakEnd;
        continue;
      }
      
      if (overlapsBreak) {
        currentM += 15; // Skip forward a bit to find next valid slot
        continue;
      }
    }

    slots.push(minutesToTime(currentM));
    // Enforce 30 minute intervals for everyone (Admin & Public)
    currentM += 30; 
  }

  // Categorize Lunch vs Dinner
  // Logic: 
  // 1. If time is AM (< 12:00) AND open time is also AM (< 12:00) AND close time is < 17:00 -> Lunch
  // 2. Standard split: 4 PM (16:00)
  // 3. Late night (next day, e.g., 00:30) should be Dinner
  
  const splitTime = 16 * 60; // 16:00
  
  const lunch: string[] = [];
  const dinner: string[] = [];

  slots.forEach(t => {
     const tm = timeToMinutes(t);
     
     // If the slot is "smaller" than open time, it implies it wrapped to next day
     // e.g. Open 11:30. Slot 00:30. 30 < 690.
     // Therefore it is late night -> Dinner
     if (tm < openM) {
         dinner.push(t);
         return;
     }

     if (tm < splitTime) {
         lunch.push(t);
     } else {
         dinner.push(t);
     }
  });

  return { lunch, dinner };
};

// Helper to determine if a selected time needs date increment
export const shouldIncrementDate = (time: string, openTime: string): boolean => {
    if (!time || !openTime) return false;
    return timeToMinutes(time) < timeToMinutes(openTime);
};
