// src/lib/test/payfast-standalone-test.ts
/**
 * Standalone test script for PayFast integration
 * Run with: node -r esbuild-register src/lib/test/payfast-standalone-test.ts
 */

import crypto from 'crypto';

// PayFast credentials - replace with your sandbox credentials
const MERCHANT_ID = '10035674';  // Your PayFast Merchant ID
const MERCHANT_KEY = '9nqhf208lzpc4';  // Your PayFast Merchant Key
const PASSPHRASE = 'personalprojectssanding';  // Your PayFast Passphrase

// Basic payment data for testing
const paymentData = {
  merchant_id: MERCHANT_ID,
  merchant_key: MERCHANT_KEY,
  return_url: 'http://localhost:5173/payment/success',
  cancel_url: 'http://localhost:5173/payment/cancel',
  notify_url: 'http://localhost:5173/api/payments/ipn',
  name_first: 'Test',
  name_last: 'User',
  email_address: 'test@example.com',
  m_payment_id: 'TEST-' + Date.now(),
  amount: '350.00',
  item_name: 'BrightBroom Test',
  item_description: 'Test payment for BrightBroom',
};

// Function to generate signature - bare bones implementation
function generateSignature(data, passphrase) {
  // Sort keys alphabetically
  const keys = Object.keys(data).sort();
  
  // Build string to hash
  let stringToHash = '';
  keys.forEach(key => {
    if (data[key] !== '' && key !== 'signature') {
      stringToHash += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  });
  
  // Remove trailing ampersand
  stringToHash = stringToHash.slice(0, -1);
  
  // Add passphrase if provided
  if (passphrase) {
    stringToHash += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }
  
  console.log('String to hash:', stringToHash.replace(/&passphrase=.*$/, '&passphrase=HIDDEN'));
  
  // Generate MD5 hash
  return crypto.createHash('md5').update(stringToHash).digest('hex');
}

// Generate signature and build URL
const signature = generateSignature(paymentData, PASSPHRASE);
console.log('Generated signature:', signature);

// Build URL manually - to avoid any encoding issues
let url = 'https://sandbox.payfast.co.za/eng/process?';
const keys = Object.keys(paymentData).sort();

keys.forEach(key => {
  if (paymentData[key] !== '') {
    url += `${key}=${encodeURIComponent(paymentData[key]).replace(/%20/g, '+')}&`;
  }
});

url += `signature=${signature}`;

console.log('\nTest URL (open in browser to test):\n', url);
