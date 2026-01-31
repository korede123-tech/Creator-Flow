# Design Mobile Creator Flow

This is a code bundle for Design Mobile Creator Flow. The original project is available at https://www.figma.com/design/qtj7NlQxj7SSlTL5E0NDrU/Design-Mobile-Creator-Flow.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Production MVP setup (Supabase + Paystack)

### Environment variables

- Copy `.env.example` to `.env` and fill:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Database migrations

- **CLI (recommended):** Migrations live in **`supabase/migrations/`** at project root (timestamp names, e.g. `20260124000000_core_mvp_foundation.sql`). Run `supabase link --project-ref <ref>` then `supabase db push`. The CLI reads **only** `supabase/migrations/`, not `src/supabase/migrations/`.
- **Dashboard:** SQL Editor → run each `.sql` in **`supabase/migrations/`** (or `src/supabase/migrations/`) **in filename order**.
- **`20260124000000_core_mvp_foundation`** runs first (creates `profiles`, `creators`, `wallets`, etc.).
- **`20260124000004_wallet_and_managed_creators`** creates `bank_accounts` and `withdrawal_requests`.
- **`20260124000005`** / **`20260124000006`** add Paystack transfers and referrals.
- **`20260124000007_referral_commission`** adds 2% referral commission (see below).
- **`20260124000008_referral_per_referral_earnings`** adds `referrals.earned_from_referred` and updates the trigger so Profile → Referral history shows "+X" per referral.
- **`20260124000009_ensure_referral_code`** backfills missing `referral_code` and adds `ensure_referral_code()` RPC; the app calls it when a profile has no code so one is always generated.
- **`20260124000010_campaigns_created_by_and_rls`** adds `campaigns.created_by`, RLS for campaign create/update and offer insert, and `send_offer_to_email` RPC (see **Campaigns → DB** below).
- **`20260124000011_seed_demo_campaigns`** adds `seed_demo_campaigns()` RPC. Seeds **demo offers** only (no campaign creation). Requires user has a `creators` row; inserts 3 `creator_campaigns` for platform-owned demo campaigns. Use **Load demo offers** in Creator → Campaigns (offers tab, empty) to run it.
- **`20260124000012_platform_demos_and_managed_creator_id`** adds 3 platform-owned demo campaigns (`created_by` NULL), `managed_creators.creator_id` (nullable FK to `creators`), and RLS so agencies can SELECT `creator_campaigns` for managed creators. Run 012 (after 011) so **Load demo offers** has platform campaigns to use.
- **`20260124000013_agency_review_and_post_token`** adds RLS for agencies to UPDATE `creator_campaigns` (approve/request revision) and `get_or_create_post_submit_token(p_creator_campaign_id)` RPC for the Post step.
- **`20260124000014_complete_campaign_earning_for_posted`** adds `complete_campaign_earning_for_posted(p_creator_campaign_id)` RPC. When a campaign is `posted` or `posted_verified`, the creator can call it to create a **completed** `campaign_earning` ledger entry (crediting wallet) and set status to `paid`. Idempotent. Triggers referral commission.
- **`20260124000015_creator_profile_module`** adds **Creator Profile** module: `creator_profiles`, `creator_social_accounts`, `creator_packages` tables; RLS (own CRUD, others read when `status = 'live'`); triggers. Run before using Profile → Creator Profile (Details | Social Media | Packages) and Publish.
- **`20260124000016_creator_packages_smm`** SMM-style Packages tab: truncates `creator_packages`; maps `creator_social_accounts.follower_range` to pricing tiers (`0–5k` … `100k+`); replaces package schema with `activity_type`, `price_base_ngn`, `price_converted`, `currency`, `is_price_fixed`. Run after 015. Creators re-add packages.

**To run migrations 015 and 016 (Creator Profile + SMM packages):**  
Paste **`supabase/migrations/RUN_015_016.sql`** into Supabase Dashboard → SQL Editor → New query → **Run**. Runs 015 then 016 in order.

**To run migrations `20260124000010`–`012`:**

1. **SQL Editor (easiest):** [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor** → New query. Paste the contents of **`supabase/migrations/RUN_010_011_012.sql`** and click **Run**. This runs 010, 011, and 012 in order.
2. **Or run each file separately:** Paste `20260124000010_campaigns_created_by_and_rls.sql`, then `20260124000011_seed_demo_campaigns.sql`, then `20260124000012_platform_demos_and_managed_creator_id.sql` (in that order).
3. **CLI:** `supabase login`, `supabase link --project-ref <ref>`, then `supabase db push` (applies all pending migrations).

### Campaigns → DB (create / edit / send offer)

- **Creator view:** Campaigns list and detail load from `creator_campaigns` + `campaigns`. **Accept** updates `creator_campaigns` (status `accepted`, rate); **Decline** sets status `cancelled`. When the offers tab is empty, **Load demo offers** calls `seed_demo_campaigns()` to add 3 demo offers (platform campaigns). User must have a `creators` row.
- **Agency view:** Agencies **do not** create campaigns. Agency → **Campaigns** shows **Creator campaign requests**: `creator_campaigns` (offers, status) for **creators they manage**. Managed creators must have `managed_creators.creator_id` set (link to platform creator). Empty state: "Add creators to your roster and link them to platform accounts to see their campaign requests." `send_offer_to_email` RPC remains available for future use (e.g. brand UI).

### Storage

- Create a Storage bucket named `proofs`.
- Configure bucket policies to allow authenticated uploads (or switch to signed URLs if you want the bucket private).

### Edge Functions

The deployable Edge Function lives in **`supabase/functions/make-server-8061e72e/`**. The app uses a single function; routes include **GET** `.../banks`, **POST** `.../referrals/apply`, **POST** `.../payments/creator-earning/complete`, **POST** `.../payments/withdraw/initiate`, **POST** `.../payments/paystack/webhook`, etc.

**The function will not show up in the Supabase Dashboard** until you deploy it via the CLI. To deploy:

1. **Install Supabase CLI** (if needed): [Supabase CLI](https://supabase.com/docs/guides/cli).
2. **Log in:** `supabase login`
3. **Link the project:** `supabase link --project-ref <your-project-ref>` (e.g. `qetwrowpllnkucyxoojp`). Use the ref from [Dashboard](https://supabase.com/dashboard) → Project Settings → General.
4. **Deploy the function:**
   ```bash
   supabase functions deploy make-server-8061e72e --no-verify-jwt
   ```
5. **Set secrets** (Dashboard → Project → Edge Functions → `make-server-8061e72e` → Secrets, or via CLI):
   - `SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — from Project Settings → API
   - `PAYSTACK_SECRET_KEY`
   - `FRONTEND_URL` (optional)

After deploy, the function appears under **Edge Functions** in the Dashboard. Use the same steps to **redeploy** when you change `supabase/functions/make-server-8061e72e/` (e.g. after adding routes).

### Referral join flow

- **`/join/:code`** — Invite page. User visits `/join/ABC123`, code is stored in `sessionStorage`. "Sign up" → `/?signup=1`, "Log in" → `/`. After signup, the app calls **POST** `/referrals/apply` with the stored code to set `referred_by` and create a `referrals` row. Ensure your host serves `index.html` for `/join/*` (SPA fallback).

### Referral commission (2% for 6 months)

- Referrers earn **2% of every payment** (campaign_earning) that **referred creators** receive, for **6 months** from referral activation.
- When a `campaign_earning` row is **completed** (INSERT with `status = 'completed'` or UPDATE `pending` → `completed`), a DB trigger:
  - Finds the creator’s referrer (`referred_by`), checks the 6‑month window, computes 2%, inserts a `referral_commission` ledger entry into the referrer’s wallet, updates `profiles.referral_earnings`, and updates `referrals.earned_from_referred` for that (referrer, referred) pair so Profile → Referral history shows “+X” per referral.
- Commission is part of the referrer’s **wallet balance** and can be withdrawn via the normal withdrawal flow.
- **POST** `.../payments/creator-earning/complete` — Body: `{ "creator_campaign_id": "..." }` or `{ "ledger_id": "..." }`. Marks the corresponding pending `campaign_earning` as completed (auth required). Call when escrow releases or agency marks creator as paid. Triggers the referral commission.

### Payment completion (demo)

- **"Mark as posted (demo)"** in the Post step updates the campaign to `posted_verified`, then calls **`complete_campaign_earning_for_posted(creator_campaign_id)`** RPC. The RPC creates a **completed** `campaign_earning` ledger entry (wallet balance increases), sets the campaign to `paid`, and the referral commission trigger runs if the creator was referred. Run migration **`20260124000014_complete_campaign_earning_for_posted`** before using this flow.

### Production readiness

- **Data load:** App fetch (profile, campaigns, wallet, etc.) is wrapped in try/catch. On failure, a **"Couldn’t load data"** message and **Try again** button are shown; retry bumps `refreshSeq` and refetches.
- **Loading:** While loading, a skeleton (loading state) is shown in the main content area; campaign detail stays visible during refetch.
- **Withdraw:** The withdraw modal awaits the Edge Function call, shows **Processing…** during the request, and displays API errors inline. The modal closes only on success; on failure the user can fix (e.g. amount, bank) and retry.

### Test withdrawal (no Paystack)

- In **Wallet → Withdraw**, enable **"Test withdrawal (no real transfer, marks completed immediately)"**. Submit uses **`test: true`** in the request body.
- The Edge Function **skips** Paystack (no transfer recipient, no transfer). It creates `withdrawal_requests` and `wallet_ledger`, then immediately marks both **completed**. Balance decreases, transaction appears as cleared.
- Use this to run the full withdrawal UX (modal → amount → submit → success → refresh) without Paystack keys or real transfers. Ensure you have a **bank account** in Profile and **available balance** (e.g. from **Mark as posted (demo)**).

### Paystack webhook

- Configure your Paystack webhook to point to:
  - `.../functions/v1/make-server-8061e72e/make-server-8061e72e/payments/paystack/webhook`
- Ensure the Edge Function has `PAYSTACK_SECRET_KEY` set so webhook signature verification succeeds.
