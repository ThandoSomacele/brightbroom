// netlify/functions/recurring-charge-cron.js
/**
 * Netlify Scheduled Function
 *
 * This function runs on a schedule to process recurring subscription charges.
 *
 * To set up the schedule:
 * 1. Go to your Netlify site dashboard
 * 2. Navigate to Functions
 * 3. Find this function and click "Configure"
 * 4. Set the schedule (e.g., "0 2 * * *" for 2 AM daily)
 *
 * Or configure via netlify.toml:
 * [[functions]]
 *   name = "recurring-charge-cron"
 *   schedule = "0 2 * * *"  # Runs daily at 2 AM UTC
 */

exports.handler = async (event, context) => {
  console.log("[Cron] Starting recurring charge processing job");

  try {
    // Determine the base URL from the request headers
    // This ensures we call the same deployment that triggered the function
    const host = event.headers.host || event.headers[':authority'];
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const baseUrl = host ? `${protocol}://${host}` : (process.env.URL || "http://localhost:5173");

    const apiUrl = `${baseUrl}/api/subscriptions/process-recurring`;

    console.log(`[Cron] Base URL: ${baseUrl}`);
    console.log(`[Cron] Calling API: ${apiUrl}`);

    // Call the API endpoint to process recurring charges
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include authorization if you set up CRON_SECRET_TOKEN
        ...(process.env.CRON_SECRET_TOKEN && {
          Authorization: `Bearer ${process.env.CRON_SECRET_TOKEN}`,
        }),
      },
    });

    console.log(`[Cron] Response status: ${response.status}`);
    console.log(`[Cron] Response headers:`, Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`[Cron] Non-JSON response received:`, text.substring(0, 200));
      const errorDetails = {
        message: `Expected JSON response but got ${contentType}`,
        responsePreview: text.substring(0, 100),
        debugInfo: {
          baseUrl,
          apiUrl,
          DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
          URL: process.env.URL,
          DEPLOY_URL: process.env.DEPLOY_URL,
        }
      };
      throw new Error(JSON.stringify(errorDetails));
    }

    const data = await response.json();

    if (response.ok) {
      console.log("[Cron] Successfully processed recurring charges:", data);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Recurring charges processed successfully",
          results: data.results,
        }),
      };
    } else {
      console.error("[Cron] Error processing recurring charges:", data);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Failed to process recurring charges",
          details: data,
        }),
      };
    }
  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to execute recurring charge cron job",
        details: error.message,
        debugInfo: {
          DEPLOY_PRIME_URL: process.env.DEPLOY_PRIME_URL,
          URL: process.env.URL,
          DEPLOY_URL: process.env.DEPLOY_URL,
        }
      }),
    };
  }
};
