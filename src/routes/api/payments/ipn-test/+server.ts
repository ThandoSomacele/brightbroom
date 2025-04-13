// Add this to src/routes/api/payments/ipn-test/+server.ts
export async function GET() {
  return new Response("IPN endpoint test - GET successful", {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}

export async function POST() {
  return new Response("IPN endpoint test - POST successful", {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}
