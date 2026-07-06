-- Make the DB-level audit trigger resilient: only record actedById when the
-- session user GUC actually maps to a real app_users row, otherwise leave it
-- NULL. Prevents FK violations when the acting principal isn't persisted
-- (e.g. system jobs) while the app layer still writes rich audit entries.
CREATE OR REPLACE FUNCTION fn_hf_audit_status() RETURNS TRIGGER AS $$
DECLARE
  v_uid text := NULLIF(current_setting('app.user_id', true), '');
  v_actor text;
BEGIN
  SELECT id INTO v_actor FROM app_users WHERE id = v_uid;
  INSERT INTO form_audit_log ("id", "formId", "action", "oldValue", "newValue", "actedById")
  VALUES (gen_random_uuid()::text, NEW.id, 'UPDATE', OLD.status::text, NEW.status::text, v_actor);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
