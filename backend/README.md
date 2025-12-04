# Backend (Laravel 12)

Este diretório contém a API do **Sistema de Gestão de Salão de Beleza**, implementada em Laravel 12 com PHP 8.2+. O backend expõe endpoints REST protegidos por Laravel Sanctum (cookies + CSRF) e aplica controle de acesso baseado em papéis e permissões (RBAC) via middleware `permission:{screenSlug},{actionSlug}`.

## Usuários padrão (seeders)

Ao executar `php artisan migrate --seed`, os perfis abaixo serão criados automaticamente. Todos utilizam a senha **`Senha!123`**.

| Perfil         | Nome completo              | Usuário     | E-mail                         |
| -------------- | -------------------------- | ----------- | ------------------------------ |
| Administrador  | Administrador Geral        | `admin`     | `admin@yazolabs.com`           |
| Gerente        | Gerente Operacional        | `manager`   | `manager@yazolabs.com`         |
| Profissional   | Profissional do Salão      | `professional` | `professional@yazolabs.com` |
| Recepcionista  | Recepcionista do Salão     | `receptionist` | `receptionist@yazolabs.com` |

Use essas credenciais para acessar o frontend e validar cenários de RBAC. Cada usuário recebe automaticamente as permissões descritas no YAML (dashboard, usuários, serviços, agendamentos, caixa, etc.).

## Principais pastas

- **app/Models** – Modelos Eloquent com casts, relacionamentos e enums compartilhados com o frontend.
- **app/Http/Controllers** – Controladores enxutos que delegam regras de negócio para os serviços e retornam `JsonResource` em camelCase.
- **app/Services** – Camada de serviços responsável por orquestrar operações de CRUD, filtros e workflows (checkout de agendamento, pagamento de comissão, etc.).
- **app/Http/Resources** – Serialização padronizada das respostas da API (camelCase, metadados de paginação, timestamps ISO8601).
- **app/Enums** – Enums PHP 8.2 (status de agendamento, tipos de comissão, etc.), espelhados no frontend.
- **app/Http/Middleware/CheckPermission.php** – Middleware que valida permissões no padrão `permission:{screenSlug},{actionSlug}`.
- **database/migrations** – Estrutura do banco (MySQL) usando `increments`, `foreignId()->constrained()` e `softDeletes()` quando aplicável.
- **database/seeders** – População inicial de ações, papéis, permissões e usuários padrão.
- **routes/api.php** – Registro das rotas `api/*`, todas protegidas por `auth:sanctum` + middleware de permissão.

## Autenticação

- Fluxo Sanctum SPA (`GET /sanctum/csrf-cookie` → requisições autenticadas com cookies HttpOnly).
- Endpoints principais: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
- Todas as rotas de negócio usam `auth:sanctum` e o middleware `permission` para RBAC.

## Testes e utilidades

- Rode `php artisan test` para executar os testes de feature.
- Utilize `php artisan optimize:clear` antes de rodar a suíte se necessário.
- Arquivo `backend/openapi.yaml` centraliza o contrato dos endpoints, servindo de base para a tipagem do frontend.

## Próximos passos

- Configure as variáveis de ambiente (`.env`) com credenciais de banco, domínios `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, etc.
- Execute as migrations e seeders (`php artisan migrate --seed`).
- Inicie o servidor (`php artisan serve`) e consuma os endpoints via frontend ou cliente HTTP.
