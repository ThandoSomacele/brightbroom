// src/routes/book/schedule/+page.server.ts
import { db } from "$lib/server/db";
import { service } from "$lib/server/db/schema";
import { redirect } from "@sveltejs/kit";
import {
  addDays,
  addHours,
  format,
  isWeekend,
  setHours,
  setMinutes,
} from "date-fns";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  // Check if the user is logged in
  if (!locals.user) {
    throw redirect(302, "/auth/login?redirectTo=/book/schedule");
  }

  // Get the service ID from query parameters
  const serviceId = url.searchParams.get("serviceId");

  // If no service ID is provided, redirect to the first step
  if (!serviceId) {
    throw redirect(302, "/book");
  }

  // Get service data to determine duration
  const services = await db
    .select()
    .from(service)
    .where(eq(service.id, serviceId));

  if (services.length === 0) {
    throw redirect(302, "/book");
  }

  const selectedService = services[0];
  const serviceDuration = selectedService.durationHours;

  // Generate available dates for the next 4 weeks (excluding weekends for this demo)
  const today = new Date();
  const availableDates = [];

  // Start from tomorrow
  let currentDate = addDays(today, 1);

  // Add dates for the next 4 weeks
  for (let i = 0; i < 28; i++) {
    // Skip weekends (for this demo - you could customise this)
    if (!isWeekend(currentDate)) {
      availableDates.push({
        date: format(currentDate, "yyyy-MM-dd"),
        displayDate: format(currentDate, "EEE, MMM d"),
        fullDisplayDate: format(currentDate, "EEEE, MMMM d, yyyy"),
      });
    }

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  // Generate all possible time slots from 8 AM to 12 PM
  const allTimeSlots = [];
  for (let hour = 8; hour <= 12; hour++) {
    const date = setHours(setMinutes(new Date(), 0), hour);
    allTimeSlots.push({
      time: format(date, "HH:mm"),
      displayTime: format(date, "h:mm a"),
    });
  }

  // Filter out time slots that would end after 6 PM based on service duration
  const timeSlots = allTimeSlots.filter((slot) => {
    // Parse the time slot
    const [hours, minutes] = slot.time.split(":").map(Number);
    const startTime = setHours(setMinutes(new Date(), minutes), hours);

    // Calculate end time by adding duration
    const endTime = addHours(startTime, serviceDuration);

    // Include this slot only if it ends at or before 6 PM (18:00) exactly
    return (
      endTime.getHours() < 18 ||
      (endTime.getHours() === 18 && endTime.getMinutes() === 0)
    );
  });

  return {
    availableDates,
    timeSlots,
    selectedService,
  };
};
