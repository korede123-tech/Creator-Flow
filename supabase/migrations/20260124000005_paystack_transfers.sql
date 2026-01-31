-- Paystack transfer support

-- Bank account fields required for transfer recipients
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS recipient_code TEXT;
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'nuban';
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'NGN';

CREATE INDEX IF NOT EXISTS idx_bank_accounts_recipient_code ON bank_accounts(recipient_code);

-- Withdrawal tracking fields for Paystack transfers
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS paystack_transfer_code TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS paystack_transfer_id BIGINT;
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS paystack_recipient_code TEXT;

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_transfer_code ON withdrawal_requests(paystack_transfer_code);
