-- =====================================================
-- Migration: Lesson Scheduling System
-- Description: Complete system for scheduling lessons with instructor schedules, 
--              webhooks, audit logs, and availability management
-- =====================================================

-- ============================================
-- 1. INSTRUCTOR SCHEDULE TABLES
-- ============================================

-- Add working hours to instructors (JSON format)
ALTER TABLE erp_instructors 
ADD COLUMN IF NOT EXISTS lesson_duration_minutes INTEGER DEFAULT 60 
  CHECK (lesson_duration_minutes > 0);

ALTER TABLE erp_instructors 
ADD COLUMN IF NOT EXISTS weekly_schedule JSONB DEFAULT '{
  "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
  "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
  "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
  "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
  "friday": {"enabled": true, "start": "08:00", "end": "18:00"},
  "saturday": {"enabled": true, "start": "08:00", "end": "12:00"},
  "sunday": {"enabled": false, "start": null, "end": null}
}'::jsonb;

COMMENT ON COLUMN erp_instructors.lesson_duration_minutes 
IS 'Default lesson duration in minutes (50, 60, etc)';

COMMENT ON COLUMN erp_instructors.weekly_schedule 
IS 'Weekly working hours schedule in JSON format';

-- Instructor manual blocks (vacations, appointments, etc)
CREATE TABLE IF NOT EXISTS erp_instructor_blocks (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES erp_instructors(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(200),
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_block_time CHECK (end_time > start_time)
);

CREATE INDEX idx_instructor_blocks_instructor ON erp_instructor_blocks(instructor_id);
CREATE INDEX idx_instructor_blocks_date ON erp_instructor_blocks(block_date);

-- ============================================
-- 2. LESSONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS erp_lessons (
  id SERIAL PRIMARY KEY,
  
  -- Required relationships
  contract_item_id INTEGER NOT NULL REFERENCES erp_contract_items(id),
  instructor_id INTEGER NOT NULL REFERENCES erp_instructors(id),
  vehicle_id INTEGER NOT NULL REFERENCES erp_vehicles(id),
  
  -- Date and time
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  
  -- Lesson details
  topic VARCHAR(200),
  location VARCHAR(200),
  notes TEXT,
  instructor_notes TEXT,
  
  -- Audit fields by status
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_by UUID NOT NULL REFERENCES auth.users(id),
  
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  
  no_show_at TIMESTAMPTZ,
  no_show_by UUID REFERENCES auth.users(id),
  
  -- Webhook tracking
  webhook_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_lesson_time CHECK (end_time > start_time)
);

-- Indexes for performance
CREATE INDEX idx_lessons_date ON erp_lessons(lesson_date);
CREATE INDEX idx_lessons_instructor_date ON erp_lessons(instructor_id, lesson_date);
CREATE INDEX idx_lessons_vehicle_date ON erp_lessons(vehicle_id, lesson_date);
CREATE INDEX idx_lessons_contract_item ON erp_lessons(contract_item_id);
CREATE INDEX idx_lessons_status ON erp_lessons(status);
CREATE INDEX idx_lessons_scheduled_by ON erp_lessons(scheduled_by);

-- Composite index for conflict checking
CREATE INDEX idx_lessons_conflict_check ON erp_lessons(
  lesson_date, start_time, end_time, instructor_id, vehicle_id
) WHERE status != 'cancelled';

-- Index for webhook job
CREATE INDEX idx_lessons_webhook_pending ON erp_lessons(lesson_date, start_time)
  WHERE status = 'scheduled' AND reminder_sent_at IS NULL;

COMMENT ON TABLE erp_lessons IS 'Scheduled driving lessons';

-- ============================================
-- 3. AUDIT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS erp_lesson_audit (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES erp_lessons(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status change tracking
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  
  -- Action context
  reason TEXT,
  metadata JSONB,
  
  -- Security tracking
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_lesson_audit_lesson ON erp_lesson_audit(lesson_id);
CREATE INDEX idx_lesson_audit_user ON erp_lesson_audit(performed_by);
CREATE INDEX idx_lesson_audit_date ON erp_lesson_audit(performed_at);

COMMENT ON TABLE erp_lesson_audit IS 'Audit log for all lesson actions';

-- ============================================
-- 4. SQL FUNCTIONS
-- ============================================

-- Function to get available credits
CREATE OR REPLACE FUNCTION get_available_credits(
  p_contract_item_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_contracted INTEGER;
  v_used INTEGER;
BEGIN
  -- Get contracted quantity
  SELECT quantity INTO v_contracted
  FROM erp_contract_items
  WHERE id = p_contract_item_id;
  
  IF v_contracted IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count scheduled lessons (not cancelled)
  SELECT COUNT(*) INTO v_used
  FROM erp_lessons
  WHERE contract_item_id = p_contract_item_id
    AND status != 'cancelled';
  
  RETURN v_contracted - COALESCE(v_used, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check lesson conflicts
CREATE OR REPLACE FUNCTION check_lesson_conflicts(
  p_lesson_id INTEGER,
  p_instructor_id INTEGER,
  p_vehicle_id INTEGER,
  p_lesson_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS TABLE (
  conflict_type VARCHAR,
  conflicting_lesson_id INTEGER,
  details TEXT
) AS $$
BEGIN
  -- Check instructor conflicts
  RETURN QUERY
  SELECT 
    'instructor'::VARCHAR,
    id,
    'Instrutor já possui aula das ' || start_time::TEXT || ' às ' || end_time::TEXT
  FROM erp_lessons
  WHERE instructor_id = p_instructor_id
    AND lesson_date = p_lesson_date
    AND status != 'cancelled'
    AND (p_lesson_id IS NULL OR id != p_lesson_id)
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
  
  -- Check vehicle conflicts
  RETURN QUERY
  SELECT 
    'vehicle'::VARCHAR,
    id,
    'Veículo já está reservado das ' || start_time::TEXT || ' às ' || end_time::TEXT
  FROM erp_lessons
  WHERE vehicle_id = p_vehicle_id
    AND lesson_date = p_lesson_date
    AND status != 'cancelled'
    AND (p_lesson_id IS NULL OR id != p_lesson_id)
    AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);
END;
$$ LANGUAGE plpgsql;

-- Function to validate instructor category vs vehicle
CREATE OR REPLACE FUNCTION validate_instructor_vehicle_category(
  p_instructor_id INTEGER,
  p_vehicle_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_instructor_category VARCHAR(5);
  v_vehicle_category VARCHAR(20);
BEGIN
  SELECT cnh_category INTO v_instructor_category
  FROM erp_instructors
  WHERE id = p_instructor_id;
  
  SELECT category INTO v_vehicle_category
  FROM erp_vehicles
  WHERE id = p_vehicle_id;
  
  -- Validation rules
  RETURN CASE
    -- Car requires B, AB, D, or E
    WHEN v_vehicle_category = 'car' THEN 
      v_instructor_category IN ('B', 'AB', 'D', 'E')
    -- Motorcycle requires A, AB, AC, AD, or AE
    WHEN v_vehicle_category = 'motorcycle' THEN 
      v_instructor_category IN ('A', 'AB', 'AC', 'AD', 'AE')
    -- Bus requires D or E
    WHEN v_vehicle_category = 'bus' THEN 
      v_instructor_category IN ('D', 'E')
    -- Truck requires E
    WHEN v_vehicle_category = 'truck' THEN 
      v_instructor_category = 'E'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to check if instructor is available (working hours + blocks)
CREATE OR REPLACE FUNCTION check_instructor_availability(
  p_instructor_id INTEGER,
  p_lesson_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS TABLE (
  is_available BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_day_of_week TEXT;
  v_schedule JSONB;
  v_day_enabled BOOLEAN;
  v_work_start TIME;
  v_work_end TIME;
  v_block_count INTEGER;
BEGIN
  -- Get day of week
  v_day_of_week := LOWER(TO_CHAR(p_lesson_date, 'Day'));
  v_day_of_week := TRIM(v_day_of_week);
  
  -- Map to schedule keys
  v_day_of_week := CASE v_day_of_week
    WHEN 'monday' THEN 'monday'
    WHEN 'tuesday' THEN 'tuesday'
    WHEN 'wednesday' THEN 'wednesday'
    WHEN 'thursday' THEN 'thursday'
    WHEN 'friday' THEN 'friday'
    WHEN 'saturday' THEN 'saturday'
    WHEN 'sunday' THEN 'sunday'
  END;
  
  -- Get instructor schedule
  SELECT weekly_schedule INTO v_schedule
  FROM erp_instructors
  WHERE id = p_instructor_id;
  
  -- Check if day is enabled
  v_day_enabled := (v_schedule->v_day_of_week->>'enabled')::BOOLEAN;
  
  IF NOT v_day_enabled THEN
    RETURN QUERY SELECT false, 'Instrutor não trabalha neste dia da semana';
    RETURN;
  END IF;
  
  -- Get working hours
  v_work_start := (v_schedule->v_day_of_week->>'start')::TIME;
  v_work_end := (v_schedule->v_day_of_week->>'end')::TIME;
  
  -- Check if lesson is within working hours
  IF p_start_time < v_work_start OR p_end_time > v_work_end THEN
    RETURN QUERY SELECT false, 
      'Fora do horário de trabalho (' || v_work_start || ' - ' || v_work_end || ')';
    RETURN;
  END IF;
  
  -- Check manual blocks
  SELECT COUNT(*) INTO v_block_count
  FROM erp_instructor_blocks
  WHERE instructor_id = p_instructor_id
    AND block_date = p_lesson_date
    AND (
      all_day = true OR
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    );
  
  IF v_block_count > 0 THEN
    RETURN QUERY SELECT false, 'Instrutor possui bloqueio manual neste horário';
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'Disponível'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_erp_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_erp_lessons_updated_at ON erp_lessons;
CREATE TRIGGER trigger_update_erp_lessons_updated_at
  BEFORE UPDATE ON erp_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_lessons_updated_at();

-- Trigger for automatic audit logging
CREATE OR REPLACE FUNCTION audit_lesson_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO erp_lesson_audit (
      lesson_id,
      action,
      performed_by,
      previous_status,
      new_status,
      metadata
    ) VALUES (
      NEW.id,
      NEW.status,
      COALESCE(
        NEW.completed_by,
        NEW.cancelled_by,
        NEW.no_show_by,
        NEW.scheduled_by
      ),
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'lesson_date', NEW.lesson_date,
        'start_time', NEW.start_time,
        'instructor_id', NEW.instructor_id,
        'vehicle_id', NEW.vehicle_id,
        'contract_item_id', NEW.contract_item_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audit_lesson_changes ON erp_lessons;
CREATE TRIGGER trigger_audit_lesson_changes
  AFTER UPDATE ON erp_lessons
  FOR EACH ROW
  EXECUTE FUNCTION audit_lesson_changes();

-- ============================================
-- 6. RLS POLICIES
-- ============================================

ALTER TABLE erp_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_lesson_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_instructor_blocks ENABLE ROW LEVEL SECURITY;

-- Lessons policies
CREATE POLICY "Users can view lessons"
  ON erp_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

CREATE POLICY "Users can manage lessons"
  ON erp_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

-- Audit policies (read-only)
CREATE POLICY "Users can view audit logs"
  ON erp_lesson_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

-- Instructor blocks policies
CREATE POLICY "Users can view instructor blocks"
  ON erp_instructor_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

CREATE POLICY "Users can manage instructor blocks"
  ON erp_instructor_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

-- ============================================
-- 7. SYSTEM SETTINGS
-- ============================================

INSERT INTO app_settings (key, value) VALUES
  ('webhook_lesson_created_url', ''),
  ('webhook_lesson_created_enabled', 'false'),
  ('webhook_lesson_reminder_url', ''),
  ('webhook_lesson_reminder_enabled', 'false'),
  ('webhook_reminder_job_time_1', '08:00'),
  ('webhook_reminder_job_time_2', '20:00')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 8. COMMENTS
-- ============================================

COMMENT ON TABLE erp_instructor_blocks IS 'Manual time blocks for instructors (vacations, appointments)';
COMMENT ON COLUMN erp_lessons.webhook_sent_at IS 'Timestamp when lesson_created webhook was sent';
COMMENT ON COLUMN erp_lessons.reminder_sent_at IS 'Timestamp when lesson_reminder webhook was sent';
