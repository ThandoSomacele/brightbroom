// netlify/functions/handler.js
export const handler = async (event, context) => {
  try {
    // Use the correct import path that Netlify's adapter creates
    const { render } = await import('/.netlify/functions-internal/sveltekit-render.mjs');
    return await render(event, context);
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'An error occurred while rendering the page',
        message: error.message
      })
    };
  }
};
