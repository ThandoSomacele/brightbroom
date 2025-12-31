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
    // Determine the base URL (production or branch deploy)
    const baseUrl =
      process.env.URL || process.env.DEPLOY_URL || "http://localhost:5173";

    const apiUrl = `${baseUrl}/api/subscriptions/process-recurring`;

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
      }),
    };
  }
};
