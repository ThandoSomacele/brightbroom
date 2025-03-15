// src/lib/test/payfast-test.ts
/**
 * This is a simple test script to check PayFast integration
 * 
 * To run:
 * 1. Copy this file to src/lib/test/payfast-test.ts
 * 2. Run with: npx vite-node src/lib/test/payfast-test.ts
 */

// Mock environment variables for testing
process.env.VITE_PAYFAST_MERCHANT_ID = '10035674';
process.env.VITE_PAYFAST_MERCHANT_KEY = '9nqhf208lzpc4';
process.env.VITE_PAYFAST_PASSPHRASE = 'personalprojectssanding';
process.env.VITE_APP_URL = 'http://localhost:5173';

// Import node crypto for signature generation
import crypto from 'crypto';

// Sample data for testing
const sampleData = {
  // PayFast required fields
  merchant_id: process.env.VITE_PAYFAST_MERCHANT_ID,
  merchant_key: process.env.VITE_PAYFAST_MERCHANT_KEY,
  return_url: `${process.env.VITE_APP_URL}/payment/success`,
  cancel_url: `${process.env.VITE_APP_URL}/payment/cancel`,
  notify_url: `${process.env.VITE_APP_URL}/api/payments/ipn`,
  
  // Customer details
  name_first: 'Test',
  name_last: 'Customer',
  email_address: 'test@example.com',
  
  // Payment details
  m_payment_id: 'TEST-' + Date.now(),
  amount: '350.00',
  item_name: 'BrightBroom Regular Cleaning',
  item_description: 'Test payment for BrightBroom',
  
  // Custom values
  custom_str1: 'test-booking-id'
};

// Function to generate signature
function generateSignature(data: Record<string, string>, passphrase: string): string {
  // Create parameter string
  let pfOutput = '';
  
  // Sort the data object by key
  const keys = Object.keys(data).sort();
  
  // Build output string
  keys.forEach(key => {
    if (data[key] !== '' && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  });

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passphrase !== null && passphrase !== '') {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(pfOutput).digest('hex');
}

// Test signature generation
const signature = generateSignature(sampleData, process.env.VITE_PAYFAST_PASSPHRASE || '');
console.log('Generated signature:', signature);

// Build full PayFast URL
const queryParams = new URLSearchParams({
  ...sampleData,
  signature
}).toString();

const payFastUrl = `https://sandbox.payfast.co.za/eng/process?${queryParams}`;

// Print test information
console.log('\n----- PayFast Integration Test -----\n');
console.log('Merchant ID:', process.env.VITE_PAYFAST_MERCHANT_ID);
console.log('Merchant Key:', process.env.VITE_PAYFAST_MERCHANT_KEY);
console.log('Salt Passphrase used for signature:', process.env.VITE_PAYFAST_PASSPHRASE ? 'YES (value hidden)' : 'NO');
console.log('\nTest Payment Details:');
console.log('Payment ID:', sampleData.m_payment_id);
console.log('Amount:', sampleData.amount);
console.log('Item:', sampleData.item_name);
console.log('\nURLs:');
console.log('Return URL:', sampleData.return_url);
console.log('Cancel URL:', sampleData.cancel_url);
console.log('Notify URL:', sampleData.notify_url);
console.log('\nGenerated Signature:', signature);
console.log('\nFull PayFast URL (first 100 chars):');
console.log(payFastUrl.substring(0, 100) + '...');
console.log('\nTo test this integration:');
console.log('1. Copy the full URL below');
console.log('2. Open it in a browser');
console.log('3. You should be redirected to the PayFast sandbox');
console.log('\nFull PayFast URL:');
console.log(payFastUrl);
console.log('\n----- End of Test -----\n');