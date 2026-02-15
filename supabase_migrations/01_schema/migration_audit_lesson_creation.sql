-- =====================================================
-- Migration: Audit Lesson Creation
-- Description: Add audit log entry when a lesson is created
-- =====================================================

-- Update the trigger function to also log lesson creation
CREATE OR REPLACE FUNCTION audit_lesson_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log lesson creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO erp_lesson_audit (
      lesson_id,
      action,
      performed_by,
      previous_status,
      new_status,
      metadata
    ) VALUES (
      NEW.id,
      'created',
      NEW.scheduled_by,
      NULL,
      NEW.status,
      jsonb_build_object(
        'lesson_date', NEW.lesson_date,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'instructor_id', NEW.instructor_id,
        'vehicle_id', NEW.vehicle_id,
        'contract_item_id', NEW.contract_item_id,
        'duration_minutes', NEW.duration_minutes
      )
    );
  END IF;
  
  -- Log status changes
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO erp_lesson_audit (
      lesson_id,
      action,
      performed_by,
      previous_status,
      new_status,
      reason,
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
      CASE 
        WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason
        WHEN NEW.status = 'no_show' THEN NEW.instructor_notes
        WHEN NEW.status = 'completed' THEN NEW.instructor_notes
        ELSE NULL
      END,
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

-- Recreate the trigger to handle both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_audit_lesson_changes ON erp_lessons;
CREATE TRIGGER trigger_audit_lesson_changes
  AFTER INSERT OR UPDATE ON erp_lessons
  FOR EACH ROW
  EXECUTE FUNCTION audit_lesson_changes();

COMMENT ON FUNCTION audit_lesson_changes() IS 'Automatically logs lesson creation and status changes to audit table';
