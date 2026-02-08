// src/lib/server/services/whatsapp.service.ts
import { db } from "$lib/server/db";
import {
  address,
  booking,
  user,
  service,
} from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import {
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_ADMIN_PHONE,
  WHATSAPP_TEMPLATE_NAME,
} from "$env/static/private";

interface BookingDetails {
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  address: string;
  price: string;
}

interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Check if WhatsApp notifications are configured
 */
function isWhatsAppConfigured(): boolean {
  return !!(
    WHATSAPP_ACCESS_TOKEN &&
    WHATSAPP_PHONE_NUMBER_ID &&
    WHATSAPP_ADMIN_PHONE &&
    WHATSAPP_TEMPLATE_NAME
  );
}

/**
 * Send a template message via WhatsApp Business Cloud API
 * @param to Recipient phone number in international format (no + prefix)
 * @param templateName The approved template name
 * @param parameters Array of parameter values for the template body
 * @returns Success status and message ID if successful
 */
async function sendTemplateMessage(
  to: string,
  templateName: string,
  parameters: string[],
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: parameters.map((text) => ({ type: "text", text })),
          },
        ],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as WhatsAppApiResponse;

    if (!response.ok || data.error) {
      const errorMessage = data.error?.message || `HTTP ${response.status}`;
      console.error("[WHATSAPP] API error:", {
        status: response.status,
        error: data.error,
      });
      return { success: false, error: errorMessage };
    }

    const messageId = data.messages?.[0]?.id;
    console.log("[WHATSAPP] Message sent successfully:", { messageId, to });
    return { success: true, messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[WHATSAPP] Error sending message:", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Format booking details for WhatsApp notification
 */
function formatBookingDetails(bookingData: {
  customerFirstName: string;
  customerLastName: string;
  scheduledDate: Date;
  serviceName: string;
  street: string;
  city: string;
  price: string;
}): BookingDetails {
  const customerName = `${bookingData.customerFirstName} ${bookingData.customerLastName}`;

  // Format date as "25 Jan 2026"
  const date = bookingData.scheduledDate.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Format time as "10:00"
  const time = bookingData.scheduledDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const addressStr = `${bookingData.street}, ${bookingData.city}`;

  // Format price as "R450.00"
  const price = `R${Number(bookingData.price).toFixed(2)}`;

  return {
    customerName,
    date,
    time,
    serviceName: bookingData.serviceName,
    address: addressStr,
    price,
  };
}

/**
 * Send WhatsApp notification to admin about a new booking
 * This is a non-blocking operation - failures are logged but don't throw
 *
 * @param bookingId The booking ID
 * @returns Success status and details
 */
export async function sendAdminBookingNotification(
  bookingId: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.log("[WHATSAPP] Not configured, skipping notification for booking:", bookingId);
      return { success: false, error: "WhatsApp not configured" };
    }

    console.log("[WHATSAPP] Preparing notification for booking:", bookingId);

    // Get booking details with related data
    const results = await db
      .select({
        booking: {
          id: booking.id,
          scheduledDate: booking.scheduledDate,
          price: booking.price,
        },
        service: {
          name: service.name,
        },
        address: {
          street: address.street,
          city: address.city,
        },
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
      })
      .from(booking)
      .innerJoin(service, eq(booking.serviceId, service.id))
      .innerJoin(address, eq(booking.addressId, address.id))
      .innerJoin(user, eq(booking.userId, user.id))
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (results.length === 0) {
      console.error("[WHATSAPP] Booking not found:", bookingId);
      return { success: false, error: "Booking not found" };
    }

    const result = results[0];

    // Format booking details for the template
    const details = formatBookingDetails({
      customerFirstName: result.user.firstName,
      customerLastName: result.user.lastName,
      scheduledDate: result.booking.scheduledDate,
      serviceName: result.service.name,
      street: result.address.street,
      city: result.address.city,
      price: result.booking.price,
    });

    // Template parameters in order: Customer, Date, Time, Service, Address, Price
    const parameters = [
      details.customerName,
      details.date,
      details.time,
      details.serviceName,
      details.address,
      details.price,
    ];

    // Send the WhatsApp message
    const sendResult = await sendTemplateMessage(
      WHATSAPP_ADMIN_PHONE,
      WHATSAPP_TEMPLATE_NAME,
      parameters,
    );

    console.log("[WHATSAPP] Notification result for booking:", {
      bookingId,
      success: sendResult.success,
      messageId: sendResult.messageId,
      error: sendResult.error,
    });

    return sendResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[WHATSAPP] Error sending admin notification:", {
      bookingId,
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}
