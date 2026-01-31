import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { detectPlatform, getProvider } from './scrape-providers.tsx';

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * POST /api/public/post/submit
 * Submit a post URL for a campaign
 */
app.post('/api/public/post/submit', async (c) => {
  try {
    const { token, post_url } = await c.req.json();

    if (!token || !post_url) {
      return c.json({ error: 'Missing required fields: token, post_url' }, 400);
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('campaign_tokens')
      .select('*, creator_campaigns(*)')
      .eq('token', token)
      .eq('token_type', 'post_submit')
      .single();

    if (tokenError || !tokenData) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return c.json({ error: 'Token has expired' }, 401);
    }

    // Check if already used/finalized
    if (tokenData.used || tokenData.creator_campaigns.status === 'posted' || tokenData.creator_campaigns.status === 'paid') {
      return c.json({ error: 'Campaign already finalized' }, 400);
    }

    // Detect platform from URL
    const platform = detectPlatform(post_url);
    if (!platform) {
      return c.json({ error: 'Could not detect platform from URL. Supported: TikTok, Instagram, YouTube' }, 400);
    }

    const creatorCampaignId = tokenData.creator_campaign_id;

    // Update creator_campaign
    const { error: updateError } = await supabase
      .from('creator_campaigns')
      .update({
        post_url,
        post_platform: platform,
        post_submitted_at: new Date().toISOString(),
        scrape_status: 'queued',
        status: 'submitted'
      })
      .eq('id', creatorCampaignId);

    if (updateError) {
      console.error('Error updating creator_campaign:', updateError);
      return c.json({ error: 'Failed to update campaign' }, 500);
    }

    // Create scrape job
    const { error: jobError } = await supabase
      .from('post_scrape_jobs')
      .insert({
        creator_campaign_id: creatorCampaignId,
        attempt: 0,
        status: 'queued',
        next_run_at: new Date().toISOString(),
        provider: platform
      });

    if (jobError) {
      console.error('Error creating scrape job:', jobError);
      return c.json({ error: 'Failed to queue scrape job' }, 500);
    }

    // Mark token as used
    await supabase
      .from('campaign_tokens')
      .update({ used: true })
      .eq('token', token);

    return c.json({
      success: true,
      message: 'Post submitted successfully',
      platform,
      scrape_status: 'queued'
    });

  } catch (error) {
    console.error('Error in post submit:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/public/post/status
 * Check the status of a post submission
 */
app.get('/api/public/post/status', async (c) => {
  try {
    const token = c.req.query('token');

    if (!token) {
      return c.json({ error: 'Missing token parameter' }, 400);
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('campaign_tokens')
      .select('*, creator_campaigns(*)')
      .eq('token', token)
      .eq('token_type', 'post_submit')
      .single();

    if (tokenError || !tokenData) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const campaign = tokenData.creator_campaigns;

    return c.json({
      success: true,
      status: campaign.status,
      scrape_status: campaign.scrape_status,
      scrape_error: campaign.scrape_error,
      post_verified_at: campaign.post_verified_at,
      metrics: campaign.metrics_json,
      views: campaign.views,
      likes: campaign.likes,
      comments: campaign.comments,
      shares: campaign.shares,
      proof_type: campaign.proof_type,
      payout_amount: campaign.rate
    });

  } catch (error) {
    console.error('Error checking post status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/public/post/manual-proof
 * Upload manual proof when scraping fails
 */
app.post('/api/public/post/manual-proof', async (c) => {
  try {
    const { token, screenshot_url } = await c.req.json();

    if (!token || !screenshot_url) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('campaign_tokens')
      .select('creator_campaign_id')
      .eq('token', token)
      .eq('token_type', 'post_submit')
      .single();

    if (tokenError || !tokenData) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Update campaign with manual proof
    const { error: updateError } = await supabase
      .from('creator_campaigns')
      .update({
        proof_type: 'manual',
        proof_asset_url: screenshot_url,
        scrape_status: 'success',
        post_verified_at: new Date().toISOString(),
        status: 'posted'
      })
      .eq('id', tokenData.creator_campaign_id)
      .eq('scrape_status', 'needs_manual_proof');

    if (updateError) {
      console.error('Error updating manual proof:', updateError);
      return c.json({ error: 'Failed to save proof' }, 500);
    }

    return c.json({
      success: true,
      message: 'Manual proof submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting manual proof:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Background worker endpoint - processes scrape jobs
 * This should be called by a cron job or scheduled function
 */
app.post('/api/internal/process-scrape-jobs', async (c) => {
  try {
    // Get queued jobs that are ready to run
    const { data: jobs, error: jobsError } = await supabase
      .from('post_scrape_jobs')
      .select('*, creator_campaigns(*)')
      .eq('status', 'queued')
      .lte('next_run_at', new Date().toISOString())
      .limit(10); // Process 10 at a time

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return c.json({ error: 'Failed to fetch jobs' }, 500);
    }

    if (!jobs || jobs.length === 0) {
      return c.json({ message: 'No jobs to process', processed: 0 });
    }

    const results = [];

    for (const job of jobs) {
      try {
        // Mark as running
        await supabase
          .from('post_scrape_jobs')
          .update({ status: 'running' })
          .eq('job_id', job.job_id);

        // Get provider and scrape
        const provider = getProvider(job.provider);
        if (!provider) {
          throw new Error(`Unknown provider: ${job.provider}`);
        }

        const scrapeResult = await provider.scrape(job.creator_campaigns.post_url);

        if (scrapeResult.success && scrapeResult.metrics) {
          // Update creator_campaign with success
          await supabase
            .from('creator_campaigns')
            .update({
              scrape_status: 'success',
              post_verified_at: new Date().toISOString(),
              last_scraped_at: new Date().toISOString(),
              post_id: scrapeResult.postId,
              metrics_json: scrapeResult.metrics.raw || scrapeResult.metrics,
              views: scrapeResult.metrics.views,
              likes: scrapeResult.metrics.likes,
              comments: scrapeResult.metrics.comments,
              shares: scrapeResult.metrics.shares,
              proof_type: 'scraped',
              status: 'posted' // Transition to posted
            })
            .eq('id', job.creator_campaign_id);

          // Mark job as success
          await supabase
            .from('post_scrape_jobs')
            .update({ status: 'success' })
            .eq('job_id', job.job_id);

          // Trigger payout (implement payout logic here)
          await triggerPayout(job.creator_campaign_id);

          results.push({ job_id: job.job_id, status: 'success' });

        } else {
          // Handle failure
          const newAttempt = job.attempt + 1;
          
          if (newAttempt >= 3) {
            // Max retries reached - needs manual proof
            await supabase
              .from('creator_campaigns')
              .update({
                scrape_status: 'needs_manual_proof',
                scrape_error: scrapeResult.error
              })
              .eq('id', job.creator_campaign_id);

            await supabase
              .from('post_scrape_jobs')
              .update({ 
                status: 'failed',
                error: scrapeResult.error
              })
              .eq('job_id', job.job_id);

            results.push({ job_id: job.job_id, status: 'failed', error: scrapeResult.error });

          } else {
            // Retry with exponential backoff
            const backoffMinutes = Math.pow(2, newAttempt) * 5; // 10, 20, 40 minutes
            const nextRunAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

            await supabase
              .from('post_scrape_jobs')
              .update({
                status: 'queued',
                attempt: newAttempt,
                next_run_at: nextRunAt.toISOString(),
                error: scrapeResult.error
              })
              .eq('job_id', job.job_id);

            results.push({ job_id: job.job_id, status: 'retry', attempt: newAttempt });
          }
        }

      } catch (error) {
        console.error(`Error processing job ${job.job_id}:`, error);
        results.push({ 
          job_id: job.job_id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return c.json({
      success: true,
      processed: jobs.length,
      results
    });

  } catch (error) {
    console.error('Error processing scrape jobs:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Trigger payout for a campaign (idempotent)
 */
async function triggerPayout(creatorCampaignId: string) {
  try {
    // Check if payout already exists
    const { data: existing } = await supabase
      .from('wallet_ledger')
      .select('ledger_id')
      .eq('creator_campaign_id', creatorCampaignId)
      .eq('type', 'campaign_earning')
      .single();

    if (existing) {
      console.log(`Payout already exists for campaign ${creatorCampaignId}`);
      return;
    }

    // Get campaign details
    const { data: campaign } = await supabase
      .from('creator_campaigns')
      .select('*, creators(wallet_id)')
      .eq('id', creatorCampaignId)
      .single();

    if (!campaign) {
      console.error(`Campaign not found: ${creatorCampaignId}`);
      return;
    }

    // Create wallet ledger entry
    await supabase
      .from('wallet_ledger')
      .insert({
        wallet_id: campaign.creators.wallet_id,
        type: 'campaign_earning',
        amount: campaign.rate,
        status: 'pending',
        creator_campaign_id: creatorCampaignId
      });

    // Update campaign status
    await supabase
      .from('creator_campaigns')
      .update({ status: 'paid' })
      .eq('id', creatorCampaignId);

    console.log(`Payout triggered for campaign ${creatorCampaignId}, amount: ${campaign.rate}`);

  } catch (error) {
    console.error('Error triggering payout:', error);
  }
}

export default app;
