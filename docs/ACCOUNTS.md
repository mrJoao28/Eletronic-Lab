# Contas e projetos

O laboratório usa Supabase Auth (e-mail/senha) com confirmação de e-mail, sessão renovável, saída e recuperação de senha.
A bancada continua disponível para visitantes; projetos locais não são enviados automaticamente a uma conta.
Configurar apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no build. Nunca usar chave secreta ou service_role no navegador.

Projeto dedicado: `lnhjmesiutpbjpjrardz`, organização `mrJoao28's Org`, região São Paulo. Plano Free.
Configurar Site URL para `https://eletronic-lab.vercel.app`, com callbacks de confirmação e recuperação nessa mesma origem.
E-mails transacionais para usuários externos precisam de SMTP próprio: o remetente padrão do Supabase é limitado a desenvolvimento.
Não desabilitar confirmação de e-mail para contornar essa restrição.

## Dados privados

`lab_projects` e `lab_progress` têm RLS habilitada. SELECT/INSERT/UPDATE de projetos exigem o mesmo `auth.uid()` que `owner_id`; UPDATE valida também o novo dono. Acesso anônimo às tabelas é revogado.
O dashboard permite criar, abrir, renomear, arquivar/restaurar, pesquisar e filtrar montagens. Importação de arquivos locais é explícita; não é feita ao entrar.
Montagens continuam no editor quando um salvamento falha. O progresso de desafios é enviado à conta apenas após a verificação da montagem. Programas locais da CPU usam um namespace por conta.

A suíte `accounts.spec.ts` testa o contrato de UI com APIs simuladas, incluindo troca de usuário e tentativa de abrir um projeto alheio. Não substitui o ensaio de RLS no Supabase real.

O ensaio `supabase/tests/project_ownership.sql` também foi executado no banco hospedado: leitura/escrita do dono, bloqueio de troca de dono, isolamento entre duas identidades, progresso privado e acesso anônimo negado. Os usuários/linhas do ensaio existem apenas dentro de uma transação revertida, sem credenciais ou envio de e-mail.

## Revisão visual

Os relatórios de navegador guardam `midnight-scene-first.png` (bancada real com renderer de software) e `dashboard-account-fixture.png` (dashboard real com dados de teste isolados). O segundo comprova o layout da conta, sem representar uma conta pessoal nem uma medição de autenticação real.

## Validação hospedada

O candidato `5df3cc17` passou nos **19 cenários Playwright** contra a URL da Vercel, run [43427627158](https://github.com/mrJoao28/Eletronic-Lab/actions/runs/43427627158). Os cenários de conta usam APIs simuladas e isoladas; o ensaio SQL separado verificou RLS no banco hospedado. Não houve criação automática de conta pessoal.
O provedor de e-mail está habilitado com confirmação exigida; Site URL e os dois retornos de confirmação/recuperação foram salvos na origem de produção. O SMTP externo foi adiado explicitamente pelo responsável.

## Montagem em andamento

A bancada permanece em memória ao alternar para o dashboard ou a tela de login; **Continuar montagem** retoma os componentes, conexões e histórico. A simulação é pausada quando a bancada fica oculta.
O indicador distingue alterações pendentes de uma gravação concluída. Falhas de gravação não limpam esse indicador; alterações feitas durante uma gravação continuam pendentes.
Abrir outra montagem ou sair da conta com alterações pendentes exige escolher entre manter a montagem ou descartá-la. O navegador também avisa antes de fechar/recarregar uma página com mudanças.
Esse buffer não substitui o botão Salvar: ele dura enquanto a página estiver aberta e é eliminado quando a identidade da sessão muda. Não é transferido automaticamente de visitantes para contas nem entre usuários.

### Entrada e navegação

A entrada pública começa na autenticação, inclusive links antigos de bancada sem uma sessão ou escolha prévia. Contas abrem a seção Projetos; o editor abre somente após escolher/criar uma montagem. Visitantes entram explicitamente em uma lista de projetos salvos neste navegador. A escolha de visitante dura na aba e permite recarregar a montagem; entrar ou sair de uma conta remove essa escolha. A opção de voltar à bancada preserva a montagem já aberta na mesma sessão.
