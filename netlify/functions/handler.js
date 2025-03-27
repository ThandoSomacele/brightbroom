// netlify/functions/handler.js
export const handler = async (event, context) => {
  try {
    // Use the absolute path as mentioned in the docs
    const { render } = await import('/.netlify/functions-internal/sveltekit-render.mjs');
    return await render(event, context);
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred' })
    };
  }
};
