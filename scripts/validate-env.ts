#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 * Run this script to validate all required environment variables before starting the application
 * 
 * Usage: npm run validate-env
 * Or: npx tsx scripts/validate-env.ts
 */

import { validateEnvironmentVariables } from '../lib/env-validation';

console.log('🔍 Validating environment variables...\n');

const result = validateEnvironmentVariables();

if (result.valid) {
  console.log('✅ All environment variables are valid!\n');
  process.exit(0);
} else {
  console.error('❌ Environment variable validation failed:\n');
  result.errors.forEach(error => {
    console.error(`  - ${error}`);
  });
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  console.error('See docs/SECURITY_ASSESSMENT.md for more information.\n');
  process.exit(1);
}

