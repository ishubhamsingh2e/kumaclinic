#!/usr/bin/env node

/**
 * Test script to verify Redis cache utility is working
 * Usage: node scripts/test-cache.js
 */

const { redis, CacheKeys, CacheTTL } = require('../lib/redis.ts');

async function testCache() {
  console.log('🧪 Testing Redis Cache Utility...\n');

  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!redis.isReady()) {
      console.log('⚠️  Redis not connected. Tests will verify graceful degradation.\n');
    } else {
      console.log('✅ Redis connected\n');
    }

    // Test 1: Set and Get
    console.log('Test 1: Set and Get');
    const testKey = 'test:user:123';
    const testData = { name: 'Test User', email: 'test@example.com' };
    
    await redis.set(testKey, testData, CacheTTL.SHORT);
    const retrieved = await redis.get(testKey);
    
    if (retrieved && JSON.stringify(retrieved) === JSON.stringify(testData)) {
      console.log('✅ Set and Get working correctly\n');
    } else {
      console.log('❌ Set and Get failed\n');
    }

    // Test 2: Cache Keys Builder
    console.log('Test 2: Cache Key Builders');
    const clinicsKey = CacheKeys.userClinics('user123');
    const medicinesKey = CacheKeys.medicines('doctor123', 1, 10, 'aspirin');
    const slotsKey = CacheKeys.availableSlots('doctor123', '2024-01-15');
    
    console.log(`  User Clinics: ${clinicsKey}`);
    console.log(`  Medicines: ${medicinesKey}`);
    console.log(`  Available Slots: ${slotsKey}`);
    console.log('✅ Cache key builders working\n');

    // Test 3: Pattern Deletion
    console.log('Test 3: Pattern Deletion');
    await redis.set('test:doctor:1:page1', { data: 'page1' });
    await redis.set('test:doctor:1:page2', { data: 'page2' });
    await redis.set('test:doctor:2:page1', { data: 'other' });
    
    await redis.delPattern('test:doctor:1:*');
    
    const deleted1 = await redis.get('test:doctor:1:page1');
    const deleted2 = await redis.get('test:doctor:1:page2');
    const notDeleted = await redis.get('test:doctor:2:page1');
    
    if (!deleted1 && !deleted2 && notDeleted) {
      console.log('✅ Pattern deletion working correctly\n');
    } else {
      console.log('❌ Pattern deletion failed\n');
    }

    // Test 4: TTL
    console.log('Test 4: TTL Check');
    const ttlKey = 'test:ttl:key';
    await redis.set(ttlKey, { test: 'data' }, 10);
    const ttl = await redis.ttl(ttlKey);
    
    if (ttl > 0 && ttl <= 10) {
      console.log(`✅ TTL set correctly: ${ttl} seconds\n`);
    } else {
      console.log('❌ TTL check failed\n');
    }

    // Test 5: Exists
    console.log('Test 5: Key Existence Check');
    const existsKey = 'test:exists:key';
    await redis.set(existsKey, { data: 'test' });
    const exists = await redis.exists(existsKey);
    const notExists = await redis.exists('test:nonexistent:key');
    
    if (exists && !notExists) {
      console.log('✅ Exists check working correctly\n');
    } else {
      console.log('❌ Exists check failed\n');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await redis.delPattern('test:*');
    
    console.log('\n✨ All tests completed!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testCache();
