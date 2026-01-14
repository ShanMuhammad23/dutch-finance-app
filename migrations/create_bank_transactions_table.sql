-- Create bank_transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance DECIMAL(15, 2),
  reference VARCHAR(255),
  counterparty VARCHAR(255),
  account_number VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'DKK',
  transaction_type VARCHAR(20) DEFAULT 'credit', -- 'credit' or 'debit'
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_bank_transactions_organization 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bank_transactions_organization_id 
  ON bank_transactions(organization_id);
  
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date 
  ON bank_transactions(transaction_date DESC);
  
CREATE INDEX IF NOT EXISTS idx_bank_transactions_organization_date 
  ON bank_transactions(organization_id, transaction_date DESC);

-- Add comment
COMMENT ON TABLE bank_transactions IS 'Bank statement transactions imported from CSV/XLSX files';

