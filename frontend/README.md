# Sistema de Gestão - Salão de Beleza

Sistema completo de gestão para salões de beleza, incluindo agendamentos, controle de serviços, estoque, preços e controle de acesso baseado em roles (RBAC).

## 🚀 Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS** (estilização)
- **React Router** (navegação)
- **TanStack Query** (gerenciamento de estado server)
- **React Hook Form + Zod** (formulários e validação)
- **Shadcn/ui** (componentes)
- **Lucide React** (ícones)
- **Axios** (requisições HTTP)

## 📋 Funcionalidades

- ✅ Sistema de autenticação com RBAC (admin, manager, professional, receptionist)
- ✅ Dashboard com visão geral e estatísticas
- ✅ Gestão de Usuários (apenas admin)
- ✅ Gestão de Serviços
- ✅ Gestão de Itens e Estoque
- ✅ Gestão de Agendamentos
- ✅ Controle de Preços de Itens
- ✅ Histórico de Alterações de Preços
- ✅ Sidebar responsiva e colapsável
- ✅ Tabelas com busca, paginação e ordenação
- ✅ Code-splitting e lazy loading

## 🔐 Controle de Acesso (RBAC)

### Perfis de Usuário

- **Admin**: Acesso total a todas as funcionalidades
- **Manager**: Gerenciamento de serviços, itens, agendamentos e preços
- **Professional**: Visualização e edição de serviços e agendamentos
- **Receptionist**: Visualização e criação de agendamentos

### Permissões por Tela

Cada perfil possui permissões granulares definidas no arquivo `src/lib/permissions.ts`:
- `view`: Visualizar dados
- `create`: Criar novos registros
- `edit`: Editar registros existentes
- `delete`: Deletar registros

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Passos

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>

# Entre no diretório
cd <NOME_DO_PROJETO>

# Instale as dependências
npm install

# Execute o projeto em modo desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

### Build para Produção

```bash
npm run build
npm run preview
```

## 🔑 Credenciais de Teste

**Nota:** O login atual é simulado (localStorage). Use as credenciais abaixo:

- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`
- **Professional**: `professional` / `professional123`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes shadcn/ui
│   ├── AppSidebar.tsx  # Sidebar principal
│   ├── DataTable.tsx   # Tabela reutilizável
│   ├── Navbar.tsx      # Barra de navegação
│   └── ...
├── hooks/              # Hooks customizados
│   ├── useAuthUser.ts  # Hook de autenticação
│   └── usePermission.ts # Hook de permissões RBAC
├── lib/                # Utilitários
│   └── permissions.ts  # Configuração de permissões RBAC
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx
│   ├── Users.tsx
│   ├── Services.tsx
│   ├── Items.tsx
│   ├── Appointments.tsx
│   ├── ItemPrices.tsx
│   └── ItemPriceHistories.tsx
├── services/           # Serviços e API
│   └── api.ts          # Configuração Axios
├── types/              # Tipos TypeScript
│   └── auth.ts         # Tipos de autenticação
└── App.tsx             # Componente raiz
```

## 🔗 Integração API

O sistema está preparado para integração com Laravel Sanctum. Configure a URL base da API:

### Variável de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8010/api
```

### Query Keys Padronizadas

As chaves de cache do TanStack Query estão definidas em `src/services/api.ts`:

- `['users']` - Usuários
- `['services']` - Serviços
- `['items']` - Itens
- `['appointments']` - Agendamentos
- `['item-prices']` - Preços de Itens
- `['item-price-histories']` - Histórico de Preços

## 🎨 Design System

O design system está configurado em:
- `src/index.css` - Variáveis CSS (cores HSL, sombras, gradientes)
- `tailwind.config.ts` - Configuração Tailwind

### Cores Principais

- **Primary**: `#FF5733` (laranja vibrante)
- **Secondary**: `#C70039` (vermelho elegante)

## 🧪 Testes

```bash
npm run test
```

## 📚 Recursos Adicionais

- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [TanStack Query Documentation](https://tanstack.com/query)
- [Shadcn/ui Components](https://ui.shadcn.com/)

## 📄 Licença

Este projeto está sob a licença MIT.
