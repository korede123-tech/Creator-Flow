/**
 * Scrape Worker - Cron job handler
 * 
 * This should be invoked by a scheduled function or cron job
 * Example: Run every 5 minutes via Supabase Edge Functions cron
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Main worker function
 */
export async function processScra peJobs() {
  try {
    console.log('[Scrape Worker] Starting job processing...');

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-8061e72e/api/internal/process-scrape-jobs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    console.log('[Scrape Worker] Processing complete:', result);

    return result;

  } catch (error) {
    console.error('[Scrape Worker] Error:', error);
    throw error;
  }
}

// If run directly
if (import.meta.main) {
  await processScrapeJobs();
}
