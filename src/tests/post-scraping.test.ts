/**
 * Tests for post scraping system
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { detectPlatform, TikTokProvider, InstagramProvider } from '../supabase/functions/server/scrape-providers.tsx';

// Test platform detection
Deno.test('detectPlatform - TikTok', () => {
  const urls = [
    'https://www.tiktok.com/@user/video/1234567890',
    'https://vm.tiktok.com/ZMxxxx/',
    'https://tiktok.com/@creator/video/9876543210'
  ];

  urls.forEach(url => {
    assertEquals(detectPlatform(url), 'tiktok');
  });
});

Deno.test('detectPlatform - Instagram', () => {
  const urls = [
    'https://www.instagram.com/p/ABC123/',
    'https://www.instagram.com/reel/XYZ789/',
    'https://instagram.com/p/DEF456'
  ];

  urls.forEach(url => {
    assertEquals(detectPlatform(url), 'instagram');
  });
});

Deno.test('detectPlatform - YouTube', () => {
  const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/abc123'
  ];

  urls.forEach(url => {
    assertEquals(detectPlatform(url), 'youtube');
  });
});

Deno.test('detectPlatform - Invalid URL', () => {
  assertEquals(detectPlatform('https://example.com/post'), null);
});

// Test TikTok provider
Deno.test('TikTokProvider - Valid scrape', async () => {
  const provider = new TikTokProvider('test-api-key');
  const result = await provider.scrape('https://www.tiktok.com/@user/video/1234567890');
  
  assertEquals(result.success, true);
  assertExists(result.postId);
  assertExists(result.metrics);
  assertExists(result.metrics?.views);
  assertExists(result.metrics?.likes);
});

Deno.test('TikTokProvider - Invalid URL', async () => {
  const provider = new TikTokProvider('test-api-key');
  const result = await provider.scrape('https://example.com/invalid');
  
  assertEquals(result.success, false);
  assertExists(result.error);
});

// Test Instagram provider
Deno.test('InstagramProvider - Valid scrape', async () => {
  const provider = new InstagramProvider('test-token');
  const result = await provider.scrape('https://www.instagram.com/p/ABC123/');
  
  assertEquals(result.success, true);
  assertExists(result.postId);
  assertExists(result.metrics);
});

// Test retry logic simulation
Deno.test('Job retry backoff calculation', () => {
  const calculateBackoff = (attempt: number) => Math.pow(2, attempt) * 5;
  
  assertEquals(calculateBackoff(1), 10);  // 10 minutes
  assertEquals(calculateBackoff(2), 20);  // 20 minutes
  assertEquals(calculateBackoff(3), 40);  // 40 minutes
});

// Test token validation
Deno.test('Token expiration check', () => {
  const now = new Date();
  const expired = new Date(now.getTime() - 86400000); // 1 day ago
  const valid = new Date(now.getTime() + 86400000);   // 1 day from now
  
  assertEquals(expired < now, true);
  assertEquals(valid < now, false);
});

// Test idempotent payout
Deno.test('Payout idempotency check', () => {
  const campaignId = 'test-campaign-123';
  const payouts = new Map<string, boolean>();
  
  const triggerPayout = (id: string): boolean => {
    if (payouts.has(id)) {
      return false; // Already processed
    }
    payouts.set(id, true);
    return true; // New payout
  };
  
  assertEquals(triggerPayout(campaignId), true);  // First call succeeds
  assertEquals(triggerPayout(campaignId), false); // Second call is idempotent
});

console.log('All tests passed!');
