
-- Notification & Reminder System for Wilson Mastery Hub

-- 1. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_number TEXT,
  reminder_frequency TEXT DEFAULT 'daily', -- 'daily', 'twice_daily', 'weekly'
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  motivation_enabled BOOLEAN DEFAULT TRUE,
  weekly_summary_enabled BOOLEAN DEFAULT TRUE,
  streak_protection_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Push Notification Tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- 3. In-App Notifications (Notification Center)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'system', 'reminder', 'alert', 'motivation', 'achievement', 'admin'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notification Logs (Audit & Delivery Analytics)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'push', 'whatsapp', 'email', 'sms'
  status TEXT NOT NULL, -- 'sent', 'delivered', 'failed', 'rejected'
  provider_response JSONB DEFAULT '{}',
  error_message TEXT,
  delivery_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notification Queue (Retry & Scheduling)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  channels TEXT[] NOT NULL, -- ['push', 'whatsapp']
  priority TEXT DEFAULT 'normal',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed'
  retry_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS RULES (Assumes private access for users to their own data)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Preferences Policy
CREATE POLICY "Users can manage their own preferences" 
ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Tokens Policy
CREATE POLICY "Users can manage their own tokens" 
ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- Notifications Policy
CREATE POLICY "Users can view their notifications" 
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications (mark as read)" 
ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (community_role = 'admin' OR role_title ILIKE '%admin%')
  )
);

CREATE POLICY "Admins can manage all notifications" 
ON notifications FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (community_role = 'admin' OR role_title ILIKE '%admin%')
  )
);

-- Logs Policy (Admin only for full view, users can see their own status)
CREATE POLICY "Users can see their own logs"
ON notification_logs FOR SELECT USING (auth.uid() = user_id);

-- INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notification_queue_status_time ON notification_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_date ON notification_logs(user_id, created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle unread count for profiles view if needed
CREATE OR REPLACE FUNCTION get_unread_notification_count(u_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE user_id = u_id AND is_read = FALSE);
END;
$$ LANGUAGE plpgsql;
