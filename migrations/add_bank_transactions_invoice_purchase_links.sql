-- Add optional links from bank_transactions to invoices and purchases
-- When a transaction is linked, it represents the same payment as the invoice/purchase
-- so we exclude it from bank-based stats to avoid double-counting.

ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS invoice_id BIGINT NULL REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purchase_id BIGINT NULL REFERENCES purchases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_invoice_id ON bank_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_purchase_id ON bank_transactions(purchase_id);

COMMENT ON COLUMN bank_transactions.invoice_id IS 'When set, this credit is the payment for this invoice; exclude from bank income in stats';
COMMENT ON COLUMN bank_transactions.purchase_id IS 'When set, this debit is the payment for this purchase; exclude from bank expenses in stats';
