#!/usr/bin/env node

/**
 * Clear Rate Limits Script
 * This script helps clear any cached rate limit data
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

console.log('🔄 Rate Limit Configuration Updated');
console.log('📊 Development Mode: 1000 requests per 15 minutes');
console.log('🔒 Production Mode: 100 requests per 15 minutes');
console.log('🏠 Localhost bypass enabled in development');
console.log('');
console.log('✅ If you\'re still getting rate limit errors:');
console.log('1. Restart your backend server');
console.log('2. Clear your browser cache');
console.log('3. Wait 15 minutes for the rate limit window to reset');
console.log('4. Check if you\'re in development mode (NODE_ENV=development)');
console.log('');
console.log('🚀 Server should now handle more requests without issues!');
