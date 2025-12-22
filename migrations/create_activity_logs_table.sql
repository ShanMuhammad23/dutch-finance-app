-- Create activity_logs table for Danish bookkeeping compliance
-- This table stores an immutable audit trail of all system activities

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  user_id INTEGER NOT NULL,
  organization_id INTEGER,
  description TEXT NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Add comment for documentation
COMMENT ON TABLE activity_logs IS 'Immutable audit trail for Danish bookkeeping compliance. All system activities are logged here.';
COMMENT ON COLUMN activity_logs.action IS 'Type of action: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, EXPORT, IMPORT';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity: user, invoice, purchase, contact, product, organization, auth';
COMMENT ON COLUMN activity_logs.details IS 'JSON object containing additional details about the activity (e.g., changes made)';

