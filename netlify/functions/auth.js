// This is a compatibility wrapper specifically for auth functions
export const handler = async (event, context) => {
  try {
    // Dynamically import the SvelteKit auth function
    const { auth } = await import('/.netlify/functions-internal/sveltekit-auth-login.mjs');
    
    // Call the auth function with the event and context
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
