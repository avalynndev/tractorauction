#!/usr/bin/env node

/**
 * Script to find and fix common Next.js 16 build errors
 * 
 * Usage:
 *   node scripts/fix-build-errors.js --check    # Only check, don't fix
 *   node scripts/fix-build-errors.js --fix      # Check and fix automatically
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ISSUES = {
  fixed: [],
  found: [],
  errors: []
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Find all route.ts files
function findRouteFiles(dir = 'app/api') {
  const files = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

// Fix 1: Async params (Next.js 16)
function fixAsyncParams(content, filePath) {
  let modified = false;
  let newContent = content;
  
  // Pattern 1: Old sync params type
  const oldParamsPattern = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}/g;
  if (oldParamsPattern.test(content)) {
    newContent = newContent.replace(
      oldParamsPattern,
      '{ params }: { params: Promise<{ id: string }> }'
    );
    modified = true;
    ISSUES.found.push({
      file: filePath,
      issue: 'Old sync params type',
      fix: 'Updated to Promise-based params'
    });
  }
  
  // Pattern 2: Accessing params.id without await
  const directAccessPattern = /const\s+(\w+)\s*=\s*params\.(id|purchaseId|trackingNumber|auctionId|vehicleId|bidderId|reportId|valuerId|oemId|disputeId|feedbackId)/g;
  const matches = [...content.matchAll(directAccessPattern)];
  
  for (const match of matches) {
    const varName = match[1];
    const paramName = match[2];
    const oldPattern = new RegExp(`const\\s+${varName}\\s*=\\s*params\\.${paramName}`, 'g');
    
    // Check if params is Promise type
    if (content.includes('params: Promise')) {
      const newPattern = `const { ${paramName}: ${varName} } = await params`;
      if (!content.includes(`await params`)) {
        newContent = newContent.replace(oldPattern, newPattern);
        modified = true;
        ISSUES.found.push({
          file: filePath,
          issue: `Direct params.${paramName} access without await`,
          fix: `Updated to await params and destructure`
        });
      }
    }
  }
  
  // Pattern 3: Multiple param names (purchaseId, trackingNumber, etc.)
  const paramNames = ['id', 'purchaseId', 'trackingNumber', 'auctionId', 'vehicleId', 'bidderId', 'reportId', 'valuerId', 'oemId', 'disputeId', 'feedbackId'];
  
  for (const paramName of paramNames) {
    const oldTypePattern = new RegExp(`\\{\\s*params\\s*\\}\\s*:\\s*\\{\\s*params:\\s*\\{\\s*${paramName}:\\s*string\\s*\\}\\s*\\}`, 'g');
    if (oldTypePattern.test(content)) {
      newContent = newContent.replace(
        oldTypePattern,
        `{ params }: { params: Promise<{ ${paramName}: string }> }`
      );
      modified = true;
      ISSUES.found.push({
        file: filePath,
        issue: `Old sync params type for ${paramName}`,
        fix: `Updated to Promise-based params`
      });
    }
    
    // Fix direct access for this param
    const directPattern = new RegExp(`params\\.${paramName}`, 'g');
    if (directPattern.test(content) && content.includes('params: Promise')) {
      // Check if already using await
      const awaitPattern = new RegExp(`await\\s+params|const\\s+\\{[^}]*${paramName}`, 's');
      if (!awaitPattern.test(content)) {
        // This is complex, mark for manual review
        ISSUES.found.push({
          file: filePath,
          issue: `Possible direct params.${paramName} access - needs manual review`,
          fix: 'Manual fix required'
        });
      }
    }
  }
  
  return { content: newContent, modified };
}

// Fix 2: Prisma queries with both include and select
function fixPrismaIncludeSelect(content, filePath) {
  let modified = false;
  let newContent = content;
  
  // Pattern: Both include and select in same query
  const includeSelectPattern = /(\.findUnique|\.findFirst|\.findMany|\.create|\.update|\.upsert)\s*\(\s*\{[^}]*include:\s*\{[^}]*\}[^}]*select:\s*\{/s;
  
  if (includeSelectPattern.test(content)) {
    ISSUES.found.push({
      file: filePath,
      issue: 'Prisma query with both include and select',
      fix: 'Manual fix required - remove include or move relations to select'
    });
    // This is too complex to auto-fix, mark for manual review
  }
  
  return { content: newContent, modified };
}

// Fix 3: Check for common function call issues
function checkFunctionCalls(content, filePath) {
  // Check notifySellerVehicleSold calls
  const notifySellerPattern = /notifySellerVehicleSold\s*\([^)]*\)/g;
  const matches = [...content.matchAll(notifySellerPattern)];
  
  for (const match of matches) {
    const call = match[0];
    const args = call.match(/\(([^)]*)\)/)[1];
    const argCount = args.split(',').filter(a => a.trim()).length;
    
    if (argCount > 4) {
      ISSUES.found.push({
        file: filePath,
        issue: `notifySellerVehicleSold called with ${argCount} arguments (expected 4)`,
        fix: 'Remove extra arguments (likely purchase.buyer)'
      });
    }
  }
  
  // Check notifySellerAuctionScheduled calls
  const notifyAuctionPattern = /notifySellerAuctionScheduled\s*\([^)]*\)/g;
  const auctionMatches = [...content.matchAll(notifyAuctionPattern)];
  
  for (const match of auctionMatches) {
    const call = match[0];
    const args = call.match(/\(([^)]*)\)/)[1];
    const argCount = args.split(',').filter(a => a.trim()).length;
    
    if (argCount < 4) {
      ISSUES.found.push({
        file: filePath,
        issue: `notifySellerAuctionScheduled called with ${argCount} arguments (expected 4)`,
        fix: 'Add missing arguments (startTime, endTime)'
      });
    }
  }
  
  return content;
}

// Fix 4: Check for undefined/null type issues
function checkTypeIssues(content, filePath) {
  // Check for undefined in setFont calls
  if (content.includes('doc.setFont(undefined')) {
    ISSUES.found.push({
      file: filePath,
      issue: 'doc.setFont called with undefined',
      fix: 'Replace undefined with "helvetica"'
    });
  }
  
  // Check for undefined in type assignments that should be null
  if (content.includes('targetType = parsed.notificationType') && 
      !content.includes('targetType = parsed.notificationType || null')) {
    ISSUES.found.push({
      file: filePath,
      issue: 'targetType assignment may be undefined instead of null',
      fix: 'Change to: targetType = parsed.notificationType || null'
    });
  }
  
  return content;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const shouldCheck = args.includes('--check') || !shouldFix;
  
  log('\n🔍 Scanning for build errors...\n', 'cyan');
  
  const routeFiles = findRouteFiles();
  log(`Found ${routeFiles.length} route files\n`, 'blue');
  
  for (const filePath of routeFiles) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Apply fixes
      const paramsFix = fixAsyncParams(content, filePath);
      if (paramsFix.modified) {
        content = paramsFix.content;
        modified = true;
      }
      
      const prismaFix = fixPrismaIncludeSelect(content, filePath);
      if (prismaFix.modified) {
        content = prismaFix.content;
        modified = true;
      }
      
      checkFunctionCalls(content, filePath);
      checkTypeIssues(content, filePath);
      
      // Write file if modified and --fix flag is set
      if (modified && shouldFix) {
        fs.writeFileSync(filePath, content, 'utf8');
        ISSUES.fixed.push(filePath);
        log(`✓ Fixed: ${filePath}`, 'green');
      }
    } catch (error) {
      ISSUES.errors.push({ file: filePath, error: error.message });
      log(`✗ Error processing ${filePath}: ${error.message}`, 'red');
    }
  }
  
  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  if (ISSUES.fixed.length > 0) {
    log(`\n✅ Fixed ${ISSUES.fixed.length} file(s):`, 'green');
    ISSUES.fixed.forEach(file => log(`   - ${file}`, 'green'));
  }
  
  if (ISSUES.found.length > 0) {
    log(`\n⚠️  Found ${ISSUES.found.length} issue(s) that need attention:`, 'yellow');
    
    // Group by file
    const byFile = {};
    ISSUES.found.forEach(issue => {
      if (!byFile[issue.file]) {
        byFile[issue.file] = [];
      }
      byFile[issue.file].push(issue);
    });
    
    Object.entries(byFile).forEach(([file, issues]) => {
      log(`\n📄 ${file}:`, 'yellow');
      issues.forEach(issue => {
        log(`   ⚠️  ${issue.issue}`, 'yellow');
        if (shouldFix && issue.fix !== 'Manual fix required') {
          log(`      → ${issue.fix}`, 'cyan');
        } else {
          log(`      → ${issue.fix}`, 'cyan');
        }
      });
    });
  }
  
  if (ISSUES.errors.length > 0) {
    log(`\n❌ Errors: ${ISSUES.errors.length}`, 'red');
    ISSUES.errors.forEach(err => {
      log(`   - ${err.file}: ${err.error}`, 'red');
    });
  }
  
  if (ISSUES.fixed.length === 0 && ISSUES.found.length === 0 && ISSUES.errors.length === 0) {
    log('\n✅ No issues found!', 'green');
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');
  
  if (shouldCheck && !shouldFix) {
    log('💡 Run with --fix to automatically fix issues', 'blue');
  }
  
  // Exit with error code if issues found
  if (ISSUES.found.length > 0 || ISSUES.errors.length > 0) {
    process.exit(1);
  }
}

// Run the script
main();

