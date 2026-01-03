-- ============================================
-- Migration: Fix RLS Policy for Lesson Audit
-- Descrição: Adiciona política de INSERT para permitir que triggers funcionem
-- ============================================

-- A tabela erp_lesson_audit precisa permitir INSERT para que o trigger funcione
-- O trigger audit_lesson_changes() insere registros automaticamente

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Allow insert for audit trigger" ON erp_lesson_audit;

-- Criar política para permitir INSERT (necessário para triggers)
CREATE POLICY "Allow insert for audit trigger"
  ON erp_lesson_audit FOR INSERT
  WITH CHECK (true);

-- Comentário explicativo
COMMENT ON POLICY "Allow insert for audit trigger" ON erp_lesson_audit IS 
  'Permite que o trigger audit_lesson_changes() insira registros de auditoria automaticamente';
