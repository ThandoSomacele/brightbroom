// src/routes/book/schedule/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { addDays, addWeeks, format, isWeekend, setHours, setMinutes } from 'date-fns';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirectTo=/book/schedule');
  }
  
  // Generate available dates for the next 4 weeks (excluding weekends for this demo)
  const today = new Date();
  const availableDates = [];
  
  // Start from tomorrow
  let currentDate = addDays(today, 1);
  
  // Add dates for the next 4 weeks
  for (let i = 0; i < 28; i++) {
    // Skip weekends (for this demo - you could customize this)
    if (!isWeekend(currentDate)) {
      availableDates.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        displayDate: format(currentDate, 'EEE, MMM d'),
        fullDisplayDate: format(currentDate, 'EEEE, MMMM d, yyyy')
      });
    }
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
  }
  
  // Generate time slots from 8 AM to 5 PM
  const timeSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    const date = setHours(setMinutes(new Date(), 0), hour);
    timeSlots.push({
      time: format(date, 'HH:mm'),
      displayTime: format(date, 'h:mm a')
    });
  }
  
  return {
    availableDates,
    timeSlots
  };
};