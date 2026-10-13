// netlify/functions/booking-reminders-cron.js
/**
 * Netlify Scheduled Function: daily reminders.
 *
 * Calls /api/cron/send-reminders, which emails customers about tomorrow's
 * bookings. The schedule lives in netlify.toml; the endpoint requires the
 * same CRON_SECRET_TOKEN this function sends.
 */
exports.handler = async (event) => {
  console.log("[Cron] Starting reminder job");
  try {
    const host = event.headers?.host || event.headers?.[":authority"];
    const protocol = event.headers?.["x-forwarded-proto"] || "https";
    const baseUrl = host ? `${protocol}://${host}` : process.env.URL || "http://localhost:5173";
    const apiUrl = `${baseUrl}/api/cron/send-reminders`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        ...(process.env.CRON_SECRET_TOKEN && { Authorization: `Bearer ${process.env.CRON_SECRET_TOKEN}` }),
      },
    });
    const body = await response.text();
    if (!response.ok) {
      console.error(`[Cron] Reminder endpoint responded ${response.status}: ${body.slice(0, 500)}`);
      return { statusCode: 500, body: JSON.stringify({ success: false, status: response.status }) };
    }
    console.log(`[Cron] Reminder job done: ${body.slice(0, 500)}`);
    return { statusCode: 200, body };
  } catch (error) {
    console.error("[Cron] Reminder job failed:", error);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(error) }) };
  }
};
