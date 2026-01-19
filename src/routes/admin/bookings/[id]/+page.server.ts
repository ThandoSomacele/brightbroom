// src/routes/admin/bookings/[id]/+page.server.ts
import { db } from "$lib/server/db";
import {
  address,
  adminNote,
  booking,
  cleanerProfile,
  communicationLog,
  payment,
  service,
  user,
} from "$lib/server/db/schema";
import { sendCleanerChangedEmail } from "$lib/server/email-service";
import { cleanerAssignmentService } from "$lib/server/services/cleaner-assignment.service";
import { sendCleanerAssignmentNotifications } from "$lib/server/services/notification.service";
import { error, fail, redirect } from "@sveltejs/kit";
import { and, desc, eq, sql } from "drizzle-orm"; // Added sql import
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const bookingId = params.id;

  // Make sure the current user is an admin
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw redirect(302, "/auth/login?redirectTo=/admin");
  }

  if (!bookingId) {
    throw error(404, "Booking not found");
  }

  try {
    // Step 1: Fetch the basic booking information
    const bookingResult = await db
      .select({
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        duration: booking.duration,
        price: booking.price,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        userId: booking.userId,
        cleanerId: booking.cleanerId,
        serviceId: booking.serviceId,
        addressId: booking.addressId,
      })
      .from(booking)
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (bookingResult.length === 0) {
      throw error(404, "Booking not found");
    }

    const bookingData = bookingResult[0];

    // Step 2: Fetch related entities separately
    const [serviceData, addressData, paymentData] = await Promise.all([
      // Get service info
      db
        .select()
        .from(service)
        .where(eq(service.id, bookingData.serviceId))
        .limit(1)
        .then((results) => results[0] || null),

      // Get address info
      db
        .select()
        .from(address)
        .where(eq(address.id, bookingData.addressId))
        .limit(1)
        .then((results) => results[0] || null),

      // Get payment info
      db
        .select()
        .from(payment)
        .where(eq(payment.bookingId, bookingId))
        .limit(1)
        .then((results) => results[0] || null),
    ]);

    // Step 3: Fetch customer info
    const customerData = await db
      .select()
      .from(user)
      .where(eq(user.id, bookingData.userId))
      .limit(1)
      .then((results) => results[0] || null);

    // Step 4: Fetch cleaner info if assigned
    let cleanerData = null;
    let cleanerProfileData = null;

    if (bookingData.cleanerId) {
      [cleanerData, cleanerProfileData] = await Promise.all([
        db
          .select()
          .from(user)
          .where(eq(user.id, bookingData.cleanerId))
          .limit(1)
          .then((results) => results[0] || null),

        db
          .select()
          .from(cleanerProfile)
          .where(eq(cleanerProfile.userId, bookingData.cleanerId))
          .limit(1)
          .then((results) => results[0] || null),
      ]);
    }

    // Step 5: Fetch admin notes and communications
    const [adminNotes, communications] = await Promise.all([
      db
        .select()
        .from(adminNote)
        .where(eq(adminNote.bookingId, bookingId))
        .orderBy(desc(adminNote.createdAt)),

      db
        .select()
        .from(communicationLog)
        .where(eq(communicationLog.bookingId, bookingId))
        .orderBy(desc(communicationLog.createdAt)),
    ]);

    // Step 6: Get related bookings from the same customer
    const relatedBookings = await db
      .select({
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        service: {
          id: service.id,
          name: service.name,
        },
      })
      .from(booking)
      .innerJoin(service, eq(booking.serviceId, service.id))
      .where(
        and(
          eq(booking.userId, bookingData.userId),
          booking.id !== bookingId, // Exclude current booking
        ),
      )
      .orderBy(desc(booking.scheduledDate))
      .limit(5);

    // Step 7: Get customer booking count - FIXED VERSION
    const bookingCountResult = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(booking)
      .where(eq(booking.userId, bookingData.userId));

    let bookingsCount = 0;
    if (
      bookingCountResult &&
      bookingCountResult.length > 0 &&
      bookingCountResult[0].count !== undefined
    ) {
      bookingsCount = bookingCountResult[0].count;
    }

    // Step 8: Get all active cleaners for the assignment dropdown
    const {
      cleaners: availableCleanersData,
      bookingData: assignmentBookingData,
    } = await cleanerAssignmentService.findAvailableCleaners(bookingId);

    // Transform the data to match the expected format
    const availableCleaners = availableCleanersData.map((cleaner) => ({
      id: cleaner.id,
      firstName: cleaner.firstName,
      lastName: cleaner.lastName,
      cleanerProfile: {
        rating: cleaner.rating,
      },
      availability: cleaner.availability, // This will now be AVAILABLE, LIMITED, or UNAVAILABLE
      distance: cleaner.distance, // Include the distance information
    }));

    // Assemble the final booking detail object
    const bookingDetail = {
      ...bookingData,
      service: serviceData,
      address: addressData,
      payment: paymentData,
      customer: {
        ...customerData,
        bookingsCount: bookingsCount,
      },
      cleaner: cleanerData
        ? {
            ...cleanerData,
            cleanerProfile: cleanerProfileData,
          }
        : null,
    };

    return {
      booking: bookingDetail,
      availableCleaners,
      adminNotes,
      communicationLog: communications,
      relatedBookings,
    };
  } catch (err) {
    console.error("Error loading booking details:", err);
    throw error(500, "Error loading booking details");
  }
};

export const actions: Actions = {
  // Action to change booking status
  changeStatus: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const bookingId = params.id;
    const formData = await request.formData();
    const status = formData.get("status")?.toString();

    if (!bookingId || !status) {
      return fail(400, {
        error: "Missing booking ID or status",
      });
    }

    // Validate status
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      return fail(400, {
        error: "Invalid status",
      });
    }

    try {
      // Update booking status
      await db
        .update(booking)
        .set({
          status: status as any, // Type assertion to satisfy TypeScript
          updatedAt: new Date(),
        })
        .where(eq(booking.id, bookingId));

      // Add an admin note about the status change
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingId,
        content: `Status changed to ${status}`,
        addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: `Booking status updated to ${status}`,
      };
    } catch (err) {
      console.error("Error updating booking status:", err);
      return fail(500, {
        error: "Failed to update booking status",
      });
    }
  },

  // Action to assign cleaner to booking
  assignCleaner: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const bookingId = params.id;
    const formData = await request.formData();
    const cleanerId = formData.get("cleanerId")?.toString();

    if (!bookingId) {
      return fail(400, {
        error: "Missing booking ID",
      });
    }

    try {
      // Get current booking to check if cleaner is changing
      const currentBooking = await db
        .select()
        .from(booking)
        .where(eq(booking.id, bookingId))
        .limit(1);

      if (currentBooking.length === 0) {
        return fail(404, {
          error: "Booking not found",
        });
      }

      const previousCleanerId = currentBooking[0].cleanerId;

      // Either assign a new cleaner or remove the assignment
      const updateData = cleanerId
        ? { cleanerId, updatedAt: new Date() }
        : { cleanerId: null, updatedAt: new Date() };

      // Update booking
      await db.update(booking).set(updateData).where(eq(booking.id, bookingId));

      // Add an admin note about the cleaner assignment
      let noteContent = "";

      if (!previousCleanerId && cleanerId) {
        // New assignment
        const cleanerData = await db
          .select()
          .from(user)
          .where(eq(user.id, cleanerId))
          .limit(1);

        if (cleanerData.length > 0) {
          const cleaner = cleanerData[0];
          noteContent = `Cleaner assigned: ${cleaner.firstName} ${cleaner.lastName}`;
        } else {
          noteContent = "New cleaner assigned";
        }
      } else if (previousCleanerId && !cleanerId) {
        // Cleaner removed
        noteContent = "Cleaner assignment removed";
      } else if (
        previousCleanerId &&
        cleanerId &&
        previousCleanerId !== cleanerId
      ) {
        // Cleaner changed
        const cleanerData = await db
          .select()
          .from(user)
          .where(eq(user.id, cleanerId))
          .limit(1);

        if (cleanerData.length > 0) {
          const cleaner = cleanerData[0];
          noteContent = `Cleaner reassigned to: ${cleaner.firstName} ${cleaner.lastName}`;
        } else {
          noteContent = "Cleaner reassigned";
        }
      }

      if (noteContent) {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          content: noteContent,
          addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
          createdAt: new Date(),
        });
      }

      // Send notifications to both customer and cleaner when a cleaner is assigned or changed
      if (
        cleanerId &&
        (!previousCleanerId || previousCleanerId !== cleanerId)
      ) {
        try {
          const notificationResults =
            await sendCleanerAssignmentNotifications(bookingId);

          // Add a note about the notifications
          await db.insert(adminNote).values({
            id: crypto.randomUUID(),
            bookingId: bookingId,
            content: `Notifications sent: Customer (${notificationResults.customerNotified ? "Success" : "Failed"}), Cleaner (${notificationResults.cleanerNotified ? "Success" : "Failed"})`,
            addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
            createdAt: new Date(),
          });
        } catch (notificationError) {
          console.error(
            "Error sending assignment notifications:",
            notificationError,
          );
          // Don't fail the operation if just the notifications fail
        }
      }

      return {
        success: true,
        message: cleanerId
          ? "Cleaner assigned successfully"
          : "Cleaner assignment removed",
      };
    } catch (error) {
      console.error("Error assigning cleaner:", error);
      return fail(500, {
        error: "Failed to assign cleaner",
      });
    }
  },

  // Action to add admin note
  addNote: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const bookingId = params.id;
    const formData = await request.formData();
    const content = formData.get("content")?.toString();

    if (!bookingId || !content) {
      return fail(400, {
        error: "Missing booking ID or note content",
      });
    }

    try {
      // Insert admin note
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingId,
        content: content,
        addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Note added successfully",
      };
    } catch (err) {
      console.error("Error adding admin note:", err);
      return fail(500, {
        error: "Failed to add note",
      });
    }
  },

  // Action to add communication
  addCommunication: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const bookingId = params.id;
    const formData = await request.formData();
    const method = formData.get("method")?.toString();
    const content = formData.get("content")?.toString();
    const subject = formData.get("subject")?.toString();

    if (!bookingId || !method || !content) {
      return fail(400, {
        error: "Missing required fields",
      });
    }

    try {
      // Get booking to verify it exists and get customer info
      const bookingData = await db
        .select({
          id: booking.id,
          customer: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          },
        })
        .from(booking)
        .leftJoin(user, eq(booking.userId, user.id))
        .where(eq(booking.id, bookingId))
        .limit(1);

      if (bookingData.length === 0) {
        return fail(404, {
          error: "Booking not found",
        });
      }

      const customerInfo = bookingData[0].customer;
      let communicationType = "NOTE";
      let communicationSent = false;

      // Handle different communication methods
      if (method === "email" && customerInfo.email) {
        // In a real app, this would send an actual email
        communicationType = "EMAIL";

        // Record the communication
        await db.insert(communicationLog).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          type: communicationType,
          content: content,
          subject: subject || "Regarding your booking",
          sentTo: customerInfo.email,
          sentBy: `${locals.user.firstName} ${locals.user.lastName}`,
          direction: "OUTGOING",
          createdAt: new Date(),
        });

        communicationSent = true;
      } else if (method === "sms" && customerInfo.phone) {
        // In a real app, this would send an actual SMS
        communicationType = "SMS";

        // Record the communication
        await db.insert(communicationLog).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          type: communicationType,
          content: content,
          sentTo: customerInfo.phone,
          sentBy: `${locals.user.firstName} ${locals.user.lastName}`,
          direction: "OUTGOING",
          createdAt: new Date(),
        });

        communicationSent = true;
      } else if (method === "note") {
        // Just record as internal note
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingId,
          content: content,
          addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
          createdAt: new Date(),
        });

        communicationSent = true;
      }

      if (!communicationSent) {
        return fail(400, {
          error: "Failed to send communication",
        });
      }

      return {
        success: true,
        message: `${communicationType === "NOTE" ? "Note" : communicationType} sent successfully`,
      };
    } catch (err) {
      console.error("Error sending communication:", err);
      return fail(500, {
        error: "Failed to send communication",
      });
    }
  },

  autoAssignCleaner: async ({ params, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const bookingId = params.id;

    if (!bookingId) {
      return fail(400, {
        error: "Missing booking ID",
      });
    }

    try {
      // Auto-assign a cleaner
      const result =
        await cleanerAssignmentService.autoAssignCleaner(bookingId);

      if (!result.success) {
        return fail(400, {
          error: result.message || "Failed to auto-assign cleaner",
        });
      }

      // Add an admin note about the automated assignment
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingId,
        content: `Cleaner automatically assigned: ${result.message}`,
        addedBy: `${locals.user.firstName} ${locals.user.lastName} (Auto)`,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Cleaner automatically assigned successfully",
      };
    } catch (error) {
      console.error("Error auto-assigning cleaner:", error);
      return fail(500, {
        error: "Failed to auto-assign cleaner",
      });
    }
  },

  // Action to send cleaner changed notification email
  sendCleanerChangeNotification: async ({ params, request, locals }) => {
    // Verify admin role
    if (!locals.user || locals.user.role !== "ADMIN") {
      return fail(403, { error: "Unauthorized" });
    }

    const bookingId = params.id;
    const formData = await request.formData();
    const originalCleanerFirstName = formData.get("originalCleanerFirstName")?.toString() || null;
    const originalCleanerLastName = formData.get("originalCleanerLastName")?.toString() || null;

    if (!bookingId) {
      return fail(400, { error: "Missing booking ID" });
    }

    try {
      // Get booking details with customer, cleaner, service, and address
      const bookingData = await db
        .select({
          id: booking.id,
          scheduledDate: booking.scheduledDate,
          customer: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          cleanerId: booking.cleanerId,
          serviceId: booking.serviceId,
          addressId: booking.addressId,
        })
        .from(booking)
        .leftJoin(user, eq(booking.userId, user.id))
        .where(eq(booking.id, bookingId))
        .limit(1);

      if (bookingData.length === 0) {
        return fail(404, { error: "Booking not found" });
      }

      const bookingInfo = bookingData[0];

      if (!bookingInfo.cleanerId) {
        return fail(400, { error: "No cleaner assigned to this booking" });
      }

      // Get cleaner details
      const cleanerData = await db
        .select({
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: cleanerProfile.profileImageUrl,
        })
        .from(user)
        .leftJoin(cleanerProfile, eq(user.id, cleanerProfile.userId))
        .where(eq(user.id, bookingInfo.cleanerId))
        .limit(1);

      if (cleanerData.length === 0) {
        return fail(404, { error: "Cleaner not found" });
      }

      // Get service details
      const serviceData = await db
        .select({ name: service.name })
        .from(service)
        .where(eq(service.id, bookingInfo.serviceId))
        .limit(1);

      // Get address details
      const addressData = await db
        .select({
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        })
        .from(address)
        .where(eq(address.id, bookingInfo.addressId))
        .limit(1);

      // Prepare email data
      const emailData = {
        id: bookingInfo.id,
        service: { name: serviceData[0]?.name || "Cleaning Service" },
        scheduledDate: bookingInfo.scheduledDate.toISOString(),
        address: addressData[0] || { street: "", city: "", state: "", zipCode: "" },
        originalCleaner: originalCleanerFirstName && originalCleanerLastName
          ? { firstName: originalCleanerFirstName, lastName: originalCleanerLastName }
          : null,
        newCleaner: {
          firstName: cleanerData[0].firstName,
          lastName: cleanerData[0].lastName,
          profileImageUrl: cleanerData[0].profileImageUrl || undefined,
        },
      };

      // Send the email
      const emailSent = await sendCleanerChangedEmail(
        bookingInfo.customer.email,
        emailData,
      );

      if (!emailSent) {
        return fail(500, { error: "Failed to send notification email" });
      }

      // Add admin note about the notification
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingId,
        content: `Cleaner change notification sent to customer. New cleaner: ${cleanerData[0].firstName} ${cleanerData[0].lastName}`,
        addedBy: `${locals.user.firstName} ${locals.user.lastName}`,
        createdAt: new Date(),
      });

      // Add to communication log
      await db.insert(communicationLog).values({
        id: crypto.randomUUID(),
        bookingId: bookingId,
        type: "EMAIL",
        content: `Cleaner change notification - New cleaner: ${cleanerData[0].firstName} ${cleanerData[0].lastName}`,
        subject: "Cleaner Update for Your Booking",
        sentTo: bookingInfo.customer.email,
        sentBy: `${locals.user.firstName} ${locals.user.lastName}`,
        direction: "OUTGOING",
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "Cleaner change notification sent successfully",
      };
    } catch (err) {
      console.error("Error sending cleaner change notification:", err);
      return fail(500, { error: "Failed to send notification" });
    }
  },
};
