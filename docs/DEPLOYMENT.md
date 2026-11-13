# Deploy verificável

Aplicação Vite estática; Node 22, `npm ci`, `npm run build`, saída `dist`.
O build gera modelos locais gratuitos e rejeita GLB ausente ou corrompido antes de publicar.
As rotas de entrada são `/`, `/#schematic` e `/#cpu`; não há roteamento de servidor.
Modelos não usam cache imutável porque seus nomes não contêm hash; os chunks em `/assets` usam hash.

## Prévia

Projeto Vercel `eletronic-lab`, equipe `mrjoao28s-projects`.
Cada candidato deve ser criado a partir do SHA remoto da branch, nunca de uma cópia local sem rastreabilidade.
Conferir `gitSource.sha` e o estado `READY` antes de testar a URL exata da implantação.
Uma prévia pronta não significa release de produção aprovado.

## Critérios de publicação

1. Testes unitários e build verdes no SHA candidato.
2. E2E completo com Chromium/SwiftShader e artefatos guardados no Actions.
3. E2E contra a URL hospedada, com modelos, persistência, importação/exportação, desafios e CPU.
4. Registro de limitações: modelo visual aproximado, simulação didática e ausência de teste em GPU integrada física quando aplicável.

Não são necessários token, banco, conta do usuário ou integração de IA para usar o laboratório.
