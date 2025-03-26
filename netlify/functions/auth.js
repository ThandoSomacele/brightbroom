// netlify/functions/auth.js
export const handler = async (event, context) => {
  try {
    // Correct path for Netlify's functions-internal directory
    const { auth } = await import('/.netlify/functions-internal/sveltekit-auth.mjs');
    return await auth(event, context);
  } catch (error) {
    console.error('Auth handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'An error occurred during authentication',
        message: error.message
      })
    };
  }
};
