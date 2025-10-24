import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const mockUsers: User[] = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', role: 'admin', status: 'active' },
  { id: '2', name: 'Maria Santos', email: 'maria@email.com', role: 'manager', status: 'active' },
  { id: '3', name: 'Pedro Costa', email: 'pedro@email.com', role: 'professional', status: 'active' },
  { id: '4', name: 'Ana Lima', email: 'ana@email.com', role: 'receptionist', status: 'inactive' },
];

export default function Users() {
  const [users] = useState<User[]>(mockUsers);
  const { can } = usePermission();
  const { toast } = useToast();

  const handleEdit = (user: User) => {
    toast({
      title: 'Editar usuário',
      description: `Editando ${user.name}`,
    });
  };

  const handleDelete = (user: User) => {
    toast({
      title: 'Deletar usuário',
      description: `Deletando ${user.name}`,
      variant: 'destructive',
    });
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Perfil',
      render: (user: User) => (
        <Badge variant="outline" className="capitalize">
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
          {user.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (user: User) => (
        <div className="flex gap-2">
          {can('users', 'edit') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(user)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('users', 'delete') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(user)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        {can('users', 'create') && (
          <Button className="shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>

      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Buscar usuários..."
        emptyMessage="Nenhum usuário encontrado."
      />
    </div>
  );
}
