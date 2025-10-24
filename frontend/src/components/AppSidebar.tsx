import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scissors,
  UserCog,
  Package,
  Calendar,
  DollarSign,
  History,
  LogOut,
  Megaphone,
  UserCircle,
  Wallet,
  Store,
  FileText,
  Percent,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/useAuthUser';
import { usePermission } from '@/hooks/usePermission';
import { Screen } from '@/types/auth';

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  screen: Screen;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, screen: 'dashboard' },
      { title: 'Agendamentos', url: '/appointments', icon: Calendar, screen: 'appointments' },
      { title: 'Caixa', url: '/cashier', icon: Wallet, screen: 'cashier' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { title: 'Clientes', url: '/customers', icon: UserCircle, screen: 'customers' },
      { title: 'Profissionais', url: '/professionals', icon: UserCog, screen: 'professionals' },
      { title: 'Usuários', url: '/users', icon: Users, screen: 'users' },
    ],
  },
  {
    label: 'Serviços e Produtos',
    items: [
      { title: 'Serviços', url: '/services', icon: Scissors, screen: 'services' },
      { title: 'Itens', url: '/items', icon: Package, screen: 'items' },
      { title: 'Preços', url: '/item-prices', icon: DollarSign, screen: 'item-prices' },
      { title: 'Histórico de Preços', url: '/item-price-histories', icon: History, screen: 'item-price-histories' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { title: 'Fornecedores', url: '/suppliers', icon: Store, screen: 'suppliers' },
      { title: 'Contas a Pagar', url: '/accounts-payable', icon: FileText, screen: 'accounts-payable' },
      { title: 'Comissões', url: '/commissions', icon: Percent, screen: 'commissions' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { title: 'Promoções', url: '/promotions', icon: Megaphone, screen: 'promotions' },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthUser();
  const { canAccess } = usePermission();

  const collapsed = state === 'collapsed';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter sections based on user permissions
  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => canAccess(item.screen))
  })).filter(section => section.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {filteredSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'hover:bg-sidebar-accent/50'
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
