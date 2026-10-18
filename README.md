# Conecta Bairro

Marketplace de serviços locais para aproximar moradores e profissionais autônomos da própria comunidade. O projeto usa **React**, uma API REST em **Node.js** e **MySQL**.

## O que já funciona

- Catálogo público com busca por nome/serviço, filtro por categoria e bairro/cidade.
- Perfil público com apresentação, disponibilidade, lista de serviços, preços e telefone de contato.
- Cadastro e login de profissionais.
- Criação e edição do perfil e dos serviços; ativação/desativação; exclusão do perfil.
- Exclusão permanente da conta mediante confirmação de senha.
- API protegida por token, senhas armazenadas com hash, consultas parametrizadas e validação dos dados.

## Requisitos

- Node.js 20 ou superior e npm.
- MySQL 8 ou compatível.

## Preparar o MySQL

No MySQL Workbench, conecte-se à sua instância local, abra `server/schema.sql` e execute o script (botão de raio). Ele cria o banco `conecta_bairro`, as tabelas relacionais, chaves e categorias iniciais.

Como alternativa, no PowerShell a partir da pasta do projeto, execute o cliente MySQL pelo `cmd.exe`:

```powershell
& $env:ComSpec /c 'mysql -u root -p < server\schema.sql'
```

Esse comando pressupõe que `mysql.exe` esteja no `PATH`. Se sua instalação usa outro usuário, senha ou host, ajuste o comando e configure as mesmas credenciais no arquivo de ambiente da API.

## Configurar e iniciar

No PowerShell, na pasta do projeto:

```powershell
Copy-Item server\.env.example server\.env
```

Edite `server\.env`, informe a senha MySQL e substitua `JWT_SECRET` por uma chave aleatória com pelo menos 32 caracteres. Depois instale as dependências e inicie o frontend e a API:

```powershell
npm install
npm run dev
```

O frontend abre em `http://localhost:5174` e a API em `http://localhost:3001`. A porta `5174` é fixa para evitar abrir outro projeto que já esteja usando a porta padrão `5173`; se `5174` também estiver ocupada, o Vite informa o conflito em vez de escolher outra porta. A API só inicia quando consegue conectar ao banco configurado. Em outro ambiente, defina `VITE_API_URL` para apontar o frontend ao endereço da API; `FRONTEND_ORIGIN` configura a origem permitida pelo CORS.

No VS Code, pressione **F5** e escolha **Conecta Bairro (Vite)** para iniciar a interface React em `http://localhost:5174/` e abrir o Edge. Essa configuração inicia somente o frontend para que a tela possa ser visualizada independentemente do banco.

Para usar buscas, cadastro, login e salvamento de perfis, o MySQL e a API também precisam estar ativos. Depois de configurar `server\.env` e executar o esquema do banco, inicie a API em um terminal com:

```powershell
npm run dev --workspace server
```

Ou execute a tarefa **Conecta Bairro: iniciar API** pela paleta de tarefas do VS Code (`Terminal` → `Run Task`). Se a API não estiver disponível, a interface continua abrindo e informa que não conseguiu carregar os dados.

Para gerar o frontend de produção e iniciar a API:

```powershell
npm run build
npm start
```

Para executar os testes automatizados da API e da validação dos perfis:

```powershell
npm test --workspace server
```

## Rotas principais

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Criar uma conta profissional |
| `POST` | `/api/auth/login` | Público | Entrar |
| `DELETE` | `/api/auth/account` | Autenticado | Excluir conta (requer senha no corpo) |
| `GET` | `/api/categories` | Público | Listar categorias |
| `GET` | `/api/profiles` | Público | Listar perfis (`q`, `category`, `neighborhood`) |
| `GET` | `/api/profiles/:id` | Público | Consultar perfil ativo |
| `GET` | `/api/profiles/me` | Autenticado | Consultar o próprio perfil |
| `POST` | `/api/profiles/me` | Autenticado | Criar o próprio perfil |
| `PUT` | `/api/profiles/me` | Autenticado | Atualizar perfil e serviços |
| `PATCH` | `/api/profiles/me/status` | Autenticado | Ativar ou desativar o perfil |
| `DELETE` | `/api/profiles/me` | Autenticado | Excluir o próprio perfil |

Envie `Authorization: Bearer <token>` nas rotas autenticadas. Os dados do perfil aceitam `category_id`, `phone`, `neighborhood`, `city`, `bio`, `availability` e uma lista `services` de 1 a 10 itens (`title`, `description`, `price`, `price_unit`).
