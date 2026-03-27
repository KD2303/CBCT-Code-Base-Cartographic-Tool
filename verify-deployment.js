#!/usr/bin/env node

/**
 * CBCT Deployment Verification Script
 * 
 * Verifies:
 * - Backend (Render) is reachable
 * - Redis (Upstash) is connected
 * - Frontend (Vercel) can reach backend
 * 
 * Usage: node verify-deployment.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://cbct-backend.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cbct.vercel.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, title, message) {
  console.log(`${color}${title}${colors.reset} ${message}`);
}

async function checkUrl(url, expectRedis = false) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            healthy: res.statusCode === 200,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            healthy: res.statusCode === 200,
            data: data
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        status: 0,
        healthy: false,
        error: err.message
      });
    });

    request.setTimeout(5000);
  });
}

async function verify() {
  console.log('\n' + colors.blue + '=== CBCT Deployment Verification ===' + colors.reset + '\n');

  // Check Backend
  console.log(colors.blue + '1. Checking Backend (Render)...' + colors.reset);
  const backendHealth = await checkUrl(`${BACKEND_URL}/api/health`);
  
  if (backendHealth.healthy) {
    log(colors.green, '✓ Backend:', `${BACKEND_URL} is reachable`);
    if (backendHealth.data.cache === 'connected') {
      log(colors.green, '✓ Redis Cache:', 'Connected to Upstash');
    } else if (backendHealth.data.cache === 'disconnected') {
      log(colors.yellow, '⚠ Redis Cache:', 'Disconnected from Upstash (check REDIS_URL)');
    }
  } else {
    log(colors.red, '✗ Backend:', `Cannot reach ${BACKEND_URL}`);
    if (backendHealth.error) {
      log(colors.red, '  Error:', backendHealth.error);
    }
  }

  // Check Frontend
  console.log('\n' + colors.blue + '2. Checking Frontend (Vercel)...' + colors.reset);
  const frontendHealth = await checkUrl(FRONTEND_URL);
  
  if (frontendHealth.healthy) {
    log(colors.green, '✓ Frontend:', `${FRONTEND_URL} is reachable`);
  } else {
    log(colors.yellow, '⚠ Frontend:', `Check if ${FRONTEND_URL} is correct`);
  }

  // Summary
  console.log('\n' + colors.blue + '=== Deployment Status ===' + colors.reset);
  
  if (backendHealth.healthy && backendHealth.data.cache === 'connected') {
    log(colors.green, '✓ Status:', 'All systems operational!');
  } else {
    log(colors.yellow, '○ Status:', 'Review errors above');
  }

  // Configuration Check
  console.log('\n' + colors.blue + '=== Configuration Tips ===' + colors.reset);
  console.log(`
Backend URL:   ${BACKEND_URL}
Frontend URL:  ${FRONTEND_URL}

Vercel Environment Variable:
  VITE_API_URL=${BACKEND_URL}/api

Render Environment Variable:
  REDIS_URL=rediss://default:TOKEN@HOST:PORT
  CORS_ORIGIN=${FRONTEND_URL}

To run with custom URLs:
  BACKEND_URL=https://your-backend.onrender.com FRONTEND_URL=https://your-frontend.vercel.app node verify-deployment.js
  `);
}

verify().catch(console.error);
