-- Add unique constraint to prevent duplicate transactions
-- A transaction is considered duplicate if it has the same:
-- organization_id, transaction_date, amount, description, and reference (if available)

-- First, create a unique index on the combination of key fields
-- This will prevent exact duplicates from being inserted
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_unique 
  ON bank_transactions(organization_id, transaction_date, amount, description, COALESCE(reference, ''))
  WHERE reference IS NOT NULL;

-- Also create an index for transactions without reference (using account_number instead)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_unique_no_ref 
  ON bank_transactions(organization_id, transaction_date, amount, description, COALESCE(account_number, ''))
  WHERE reference IS NULL;

-- Note: The above indexes will prevent exact duplicates, but the application-level
-- duplicate checking provides more flexible matching (e.g., case-insensitive description matching)

