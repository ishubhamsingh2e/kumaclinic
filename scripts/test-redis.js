#!/usr/bin/env node

/**
 * Test script to verify Redis pub/sub is working
 * Usage: node scripts/test-redis.js
 */

const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function testRedis() {
  console.log('🔍 Testing Redis connection...\n');
  
  let pub, sub;
  
  try {
    // Create publisher and subscriber clients
    pub = new Redis(REDIS_URL);
    sub = new Redis(REDIS_URL);
    
    // Test connection
    await pub.ping();
    console.log('✅ Redis connection successful\n');
    
    // Subscribe to test channel
    console.log('📡 Subscribing to test:channel...');
    await sub.subscribe('test:channel');
    
    // Listen for messages
    sub.on('message', (channel, message) => {
      console.log(`📨 Received message on ${channel}:`, message);
      console.log('\n✅ Pub/Sub working!\n');
      cleanup();
    });
    
    // Publish test message after a delay
    setTimeout(async () => {
      console.log('📤 Publishing test message...\n');
      await pub.publish('test:channel', 'Hello from test!');
    }, 1000);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('\n❌ Timeout: No message received after 5 seconds');
      console.log('Make sure Redis is running: redis-cli ping\n');
      cleanup();
    }, 5000);
    
    function cleanup() {
      pub.quit();
      sub.quit();
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Redis error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check Redis is running: redis-cli ping');
    console.log('2. Check Redis URL:', REDIS_URL);
    console.log('3. Install Redis: brew install redis (macOS)');
    console.log('4. Start Redis: brew services start redis\n');
    
    if (pub) pub.quit();
    if (sub) sub.quit();
    process.exit(1);
  }
}

testRedis();
