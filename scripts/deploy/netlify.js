// scripts/deploy/netlify.js
import { execSync } from 'child_process';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Function to prompt user
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Main deploy function
 */
async function deployToNetlify() {
  console.log('🚀 BrightBroom Netlify Deployment Tool');
  console.log('=====================================');
  
  try {
    // Check if Netlify CLI is installed
    try {
      execSync('netlify --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ Netlify CLI is not installed. Please install it with:');
      console.error('npm install -g netlify-cli');
      process.exit(1);
    }
    
    // Run pre-deploy checks
    console.log('\n📋 Running pre-deployment checks...');
    try {
      await import('./pre-deploy.js');
    } catch (error) {
      const proceed = await prompt('⚠️ Pre-deployment checks failed. Do you want to continue anyway? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Deployment cancelled.');
        process.exit(0);
      }
    }
    
    // Check Netlify status
    console.log('\n🔍 Checking Netlify status...');
    try {
      execSync('netlify status', { stdio: 'inherit' });
    } catch (error) {
      console.log('❓ Not linked to a Netlify site yet. Let\'s link it.');
      execSync('netlify link', { stdio: 'inherit' });
    }
    
    // Choose deployment type
    const deployType = await prompt('\n📤 Choose deployment type:\n1. Production deployment\n2. Preview deployment\nChoose (1/2): ');
    
    if (deployType === '1') {
      // Production deployment
      console.log('\n🚀 Deploying to production...');
      
      // Get confirmation
      const confirm = await prompt('⚠️ This will deploy to PRODUCTION. Are you sure? (y/N): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('Deployment cancelled.');
        process.exit(0);
      }
      
      // Deploy to production
      execSync('netlify deploy --prod', { stdio: 'inherit' });
      
    } else if (deployType === '2') {
      // Preview deployment
      console.log('\n🚀 Creating preview deployment...');
      execSync('netlify deploy', { stdio: 'inherit' });
      
    } else {
      console.error('❌ Invalid option. Please choose 1 or 2.');
      process.exit(1);
    }
    
    console.log('\n✅ Deployment process completed!');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run deployment
deployToNetlify();
