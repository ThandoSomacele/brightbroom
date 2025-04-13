// netlify/functions/ipn-test.js
exports.handler = async (event, context) => {
  const method = event.httpMethod;
  
  return {
    statusCode: 200,
    body: `IPN test endpoint is working! Method: ${method}`
  };
};
