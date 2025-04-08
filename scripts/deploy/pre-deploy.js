// scripts/deploy/pre-deploy.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Run a command and capture its output
 */
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`${colors.red}Command failed:${colors.reset} ${command}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Check if there are uncommitted changes
 */
function checkGitStatus() {
  console.log(`\n${colors.blue}Checking git status...${colors.reset}`);
  
  const status = runCommand('git status --porcelain');
  
  if (!status || status === '') {
    console.log(`${colors.green}✓ No uncommitted changes${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.yellow}⚠️ You have uncommitted changes:${colors.reset}`);
    console.log(status);
    return false;
  }
}

/**
 * Run TypeScript checks
 */
function runTsCheck() {
  console.log(`\n${colors.blue}Running TypeScript checks...${colors.reset}`);
  
  try {
    execSync('npm run check', { stdio: 'inherit' });
    console.log(`${colors.green}✓ TypeScript checks passed${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ TypeScript checks failed${colors.reset}`);
    return false;
  }
}

/**
 * Run linting
 */
function runLinting() {
  console.log(`\n${colors.blue}Running linting...${colors.reset}`);
  
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Linting passed${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Linting failed${colors.reset}`);
    return false;
  }
}

/**
 * Check environment variables
 */
async function checkEnvironmentVariables() {
  console.log(`\n${colors.blue}Checking environment variables...${colors.reset}`);
  
  try {
    await import('./validate-env.js');
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Environment variable validation failed${colors.reset}`);
    return false;
  }
}

/**
 * Run all pre-deployment checks
 */
async function runPreDeployChecks() {
  console.log(`${colors.cyan}BrightBroom Pre-deployment Checklist${colors.reset}`);
  console.log(`========================================`);
  
  const results = {
    gitStatus: checkGitStatus(),
    tsCheck: runTsCheck(),
    linting: runLinting(),
    envVars: await checkEnvironmentVariables(),
  };
  
  // Validate environment variables
  try {
    await import('./validate-env.js');
    results.envVars = true;
  } catch (error) {
    console.error(`${colors.red}✗ Environment validation failed${colors.reset}`);
    results.envVars = false;
  }
  
  // Summary
  console.log(`\n${colors.cyan}Deployment Checklist Summary${colors.reset}`);
  console.log(`========================================`);
  console.log(`Git Status: ${results.gitStatus ? `${colors.green}PASS` : `${colors.yellow}WARNING`}${colors.reset}`);
  console.log(`TypeScript: ${results.tsCheck ? `${colors.green}PASS` : `${colors.red}FAIL`}${colors.reset}`);
  console.log(`Linting:    ${results.linting ? `${colors.green}PASS` : `${colors.red}FAIL`}${colors.reset}`);
  console.log(`Env Vars:   ${results.envVars ? `${colors.green}PASS` : `${colors.red}FAIL`}${colors.reset}`);
  
  // Final check
  if (results.tsCheck && results.linting && results.envVars) {
    console.log(`\n${colors.green}✅ All critical checks passed. Ready to deploy!${colors.reset}`);
    
    if (!results.gitStatus) {
      console.log(`${colors.yellow}⚠️ Note: You have uncommitted changes. Consider committing before deploying.${colors.reset}`);
    }
    
    return 0;
  } else {
    console.log(`\n${colors.red}❌ Some checks failed. Please fix issues before deploying.${colors.reset}`);
    return 1;
  }
}

// Run all checks
runPreDeployChecks()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Error running pre-deployment checks:', error);
    process.exit(1);
  });
