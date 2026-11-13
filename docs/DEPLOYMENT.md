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

## Testar uma URL hospedada

`LAB_BASE_URL=https://URL-EXATA.vercel.app npm run test:e2e` desativa o servidor local.
A suíte inclui os cenários anteriores de CPU e desafios e a importação do arquivo realmente exportado.
O workflow **Validate hosted laboratory** recebe URL e SHA conferido na Vercel e guarda relatório, traces de falhas e latências por 14 dias.
Os gatilhos das branches de validação usam a prévia do commit `58e1b87a`; os próximos candidatos devem ser verificados via execução manual com os novos valores.

## Falhas em produção e privacidade

`/api/health` e `/release.json` identificam o SHA servido. Conferir ambos após publicar.
O navegador envia no máximo uma ocorrência por categoria por carregamento: erro de renderer, perda de contexto, erro de execução ou promise rejeitada.
O endpoint aceita apenas estes códigos fixos, origem igual à aplicação e corpo de até 256 bytes.
Nomes, montagens, mensagens, stack traces, caminhos e conteúdo de arquivos nunca são enviados.
Os registros `lab-client-failure` aparecem nos Runtime Logs da Vercel com o SHA da implantação.
A hospedagem continua recebendo metadados HTTP usuais; não há rastreamento de usuários no aplicativo.
É acompanhamento básico por logs, sem alertas automáticos ou retenção externa. A disponibilidade de logs depende do plano da conta.
Para investigar, filtre `/api/client-errors` e `lab-client-failure` nos logs da implantação afetada.

## Release e rollback

1. Registrar o ID da produção atual e seu SHA antes de alterar o domínio.
2. Criar uma implantação com `target: production` e `autoAssignCustomDomains: false`, testar a URL exata e conferir `/api/health`.
3. Após os gates passarem, promover essa implantação para o projeto `eletronic-lab` da equipe `mrjoao28s-projects`.
4. Se houver regressão, usar **Instant Rollback** na Vercel apontando para o ID anterior e conferir novamente o domínio, health e CPU.
5. Rollback pode desabilitar a atribuição automática de domínios; após a correção promover explicitamente uma nova implantação.

Na primeira publicação não existe uma produção anterior: manter uma implantação estável verificada como referência para as próximas releases.
Os dados ficam no armazenamento local de cada origem: prévia e produção não compartilham montagens. Exportar/importar JSON para transferir projetos.

## Referências desta publicação

- Primeira prévia: `64eee750`, 13 E2E aprovados no run `43415345795`.
- Candidato com monitoramento: `58e1b87a`, URL `https://eletronic-c2ewlqly7-mrjoao28s-projects.vercel.app`.
- Referência de produção anterior: `dpl_6t4fNoBnrcr72ZgN63rmdVHEFgeA`, SHA `652594cc`. Antes de qualquer rollback, conferir qual implantação está atualmente em produção.
