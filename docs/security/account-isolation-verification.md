# Verificação de isolamento entre contas

Data da validação: 19/07/2026  
Ambiente: Supabase ativo do projeto SolAmigo

## Escopo

A validação utilizou duas identidades autenticadas distintas e registros temporários para confirmar o isolamento de:

- clientes;
- propostas;
- kits solares;
- modelos de PDF;
- PDFs privados de propostas;
- logos;
- imagens e recursos do bucket `pdf-assets`.

Todos os registros de teste foram criados dentro de uma transação e removidos por `ROLLBACK` ao final.

## Resultado

Cada identidade visualizou exatamente um registro próprio em cada recurso protegido. A primeira identidade tentou atualizar todos os registros temporários e somente o registro pertencente à própria conta foi alterado.

Foram aprovadas 21 verificações no banco ativo, incluindo leitura e alteração de arquivos nos três buckets usados pela aplicação.

## Correções aplicadas

Durante a auditoria foram encontradas políticas antigas e permissivas no bucket `logos`. Como políticas permissivas do PostgreSQL são combinadas com `OR`, elas permitiam que qualquer usuário autenticado alterasse ou excluísse logos de outra conta.

As migrations abaixo removem esse comportamento:

- `20260719001000_fix_logo_storage_isolation.sql` remove políticas amplas de escrita e recria as operações por pasta do proprietário;
- `20260719002000_prevent_public_bucket_listing.sql` impede listagem ampla de logos e recursos de PDF pelo SDK, mantendo a abertura de URLs conhecidas nos buckets públicos.

## Proteções permanentes

A suíte `tests/account-isolation-sql.test.ts` reconstrói o estado efetivo das políticas definidas no schema e nas migrations. O build falhará caso uma alteração futura:

- remova RLS das tabelas protegidas;
- permita CRUD sem vínculo com `auth.uid()`;
- remova o vínculo das tabelas filhas com o proprietário da proposta;
- permita leitura ou gravação fora da pasta do usuário no Storage;
- restaure políticas anônimas diretas nas tabelas de propostas;
- restaure políticas amplas de escrita ou listagem dos buckets.

## Observações

Logos e imagens do bucket `pdf-assets` continuam acessíveis por URL pública conhecida porque são usados na renderização das propostas. A listagem pelo SDK e todas as operações de gravação permanecem restritas à pasta do proprietário.
