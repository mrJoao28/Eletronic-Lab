# Contas e projetos

O laboratório usa Supabase Auth (e-mail/senha) com confirmação de e-mail, sessão renovável, saída e recuperação de senha.
A bancada continua disponível para visitantes; projetos locais não são enviados automaticamente a uma conta.
Configurar apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no build. Nunca usar chave secreta ou service_role no navegador.

Projeto dedicado: `lnhjmesiutpbjpjrardz`, organização `mrJoao28's Org`, região São Paulo. Plano Free.
Configurar Site URL para `https://eletronic-lab.vercel.app`, com callbacks de confirmação e recuperação nessa mesma origem.
E-mails transacionais para usuários externos precisam de SMTP próprio: o remetente padrão do Supabase é limitado a desenvolvimento.
Não desabilitar confirmação de e-mail para contornar essa restrição.
