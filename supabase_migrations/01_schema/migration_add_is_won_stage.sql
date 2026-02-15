-- ============================================
-- MIGRAÇÃO: Adicionar campo is_won em crm_stages
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Adicionar coluna is_won
ALTER TABLE crm_stages 
ADD COLUMN IF NOT EXISTS is_won BOOLEAN DEFAULT FALSE;

-- Criar índice para buscas rápidas de stages ganhos
CREATE INDEX IF NOT EXISTS idx_crm_stages_is_won ON crm_stages(is_won) WHERE is_won = TRUE;

-- Comentário explicativo
COMMENT ON COLUMN crm_stages.is_won IS 'Indica se esta etapa representa um negócio ganho/fechado com sucesso';

-- Verificar estrutura da tabela
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'crm_stages'
ORDER BY ordinal_position;

-- Exemplo: Marcar a última etapa de cada pipeline como "won"
-- (Descomente e ajuste conforme necessário)
/*
UPDATE crm_stages s1
SET is_won = TRUE
WHERE position = (
  SELECT MAX(position)
  FROM crm_stages s2
  WHERE s2.pipeline_id = s1.pipeline_id
);
*/

-- Verificar stages marcados como won
SELECT 
  p.name as pipeline,
  s.name as stage,
  s.position,
  s.is_default,
  s.is_won
FROM crm_stages s
JOIN crm_pipelines p ON p.id = s.pipeline_id
ORDER BY p.name, s.position;
