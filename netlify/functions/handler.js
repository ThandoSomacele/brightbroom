// This is a compatibility wrapper for SvelteKit's Netlify adapter
export const handler = async (event, context) => {
  // Dynamically import the SvelteKit render function
  const { render } = await import('/.netlify/functions-internal/sveltekit-render.mjs');
  
  try {
    // Call the render function with the event and context
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
