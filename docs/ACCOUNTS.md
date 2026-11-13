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
