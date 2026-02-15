# Documentação Funcional: CRM (Vendas)

O módulo de CRM (Customer Relationship Management) é o coração das operações de vendas da autoescola.

## Conceitos Principais

### Pipelines

O sistema suporta múltiplos pipelines (ex: "Vendas Autoescola", "Despachante"). Cada pipeline possui etapas personalizadas.

### Etapas (Stages)

As fases de venda pelas quais um negócio passa. Exemplo padrão:

1.  Novo Lead
2.  Contato Inicial
3.  Proposta Enviada
4.  Fechamento

### Negócios (Deals)

Representam uma oportunidade de venda para um cliente.

- **Campos**: Valor, Prioridade, Responsável.
- **Integração**: Pode conter link direto para a conversa no Chatwoot.
- **IA**: Resumo automático da oportunidade gerado por inteligência artificial.

## Funcionalidades Chave

- **Kanban Board**: Visualização intuitiva de drag-and-drop.
- **Automoção**: Mudança de etapa pode disparar webhooks ou atualizações.
- **Histórico**: Acompanhamento de todas as interações com o lead.
