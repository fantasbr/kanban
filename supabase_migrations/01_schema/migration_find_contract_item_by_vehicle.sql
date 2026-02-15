-- ============================================
-- Migration: Função para Encontrar Item de Contrato por Categoria de Veículo
-- Descrição: Encontra o contract_item correto baseado na categoria do veículo
-- ============================================

-- Função para encontrar o contract_item correto para uma aula baseado no veículo
CREATE OR REPLACE FUNCTION find_contract_item_for_vehicle(
  p_contract_id BIGINT,
  p_vehicle_category TEXT
) RETURNS BIGINT AS $$
DECLARE
  v_contract_item_id BIGINT;
BEGIN
  -- Buscar o primeiro contract_item que:
  -- 1. Pertence ao contrato especificado
  -- 2. Está vinculado a um catalog_item que é uma aula (is_lesson = true)
  -- 3. A categoria do veículo do catalog_item corresponde ao veículo selecionado
  -- 4. Ainda possui créditos disponíveis
  
  SELECT ci.id INTO v_contract_item_id
  FROM erp_contract_items ci
  INNER JOIN erp_contract_items_catalog cat ON ci.catalog_item_id = cat.id
  WHERE ci.contract_id = p_contract_id
    AND cat.is_lesson = true
    AND cat.vehicle_category = p_vehicle_category
    AND (
      SELECT get_available_credits(ci.id)
    ) > 0
  ORDER BY ci.id ASC
  LIMIT 1;
  
  RETURN v_contract_item_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_contract_item_for_vehicle IS 
  'Encontra o contract_item apropriado para uma aula baseado na categoria do veículo';

-- Exemplo de uso:
-- SELECT find_contract_item_for_vehicle(123, 'car');  -- Retorna ID do item "Aula de Carro"
-- SELECT find_contract_item_for_vehicle(123, 'motorcycle');  -- Retorna ID do item "Aula de Moto"
