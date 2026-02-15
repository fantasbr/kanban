-- ============================================
-- Migration: Função de Geração de Números Sequenciais
-- Descrição: Cria função para gerar números sequenciais para contratos e outros documentos
-- ============================================

-- Função para gerar números de documentos sequenciais
CREATE OR REPLACE FUNCTION generate_document_number(
  doc_type TEXT
) RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
  prefix TEXT;
BEGIN
  -- Definir prefixo baseado no tipo de documento
  CASE doc_type
    WHEN 'contract' THEN prefix := 'CONT';
    WHEN 'invoice' THEN prefix := 'INV';
    WHEN 'receipt' THEN prefix := 'REC';
    ELSE prefix := 'DOC';
  END CASE;

  -- Buscar o próximo número baseado no tipo de documento
  IF doc_type = 'contract' THEN
    SELECT COALESCE(MAX(
      CASE 
        WHEN contract_number ~ '^CONT-[0-9]+$' 
        THEN CAST(SUBSTRING(contract_number FROM 6) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1 INTO next_number
    FROM erp_contracts;
  ELSE
    -- Para outros tipos, começar do 1
    next_number := 1;
  END IF;

  -- Formatar número com zeros à esquerda (ex: CONT-001, CONT-002)
  formatted_number := prefix || '-' || LPAD(next_number::TEXT, 3, '0');

  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Comentário
COMMENT ON FUNCTION generate_document_number(TEXT) IS 'Gera números sequenciais para documentos (contratos, faturas, etc.)';

-- Exemplo de uso:
-- SELECT generate_document_number('contract'); -- Retorna: CONT-001, CONT-002, etc.
