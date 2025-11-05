import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2, ChevronsUpDown, Check } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listUsers, createUser, updateUser, deleteUser } from "@/services/userService";
import { listRoles } from "@/services/roleService";
import type { User, CreateUserDto, UpdateUserDto } from "@/types/user";
import type { Role } from "@/types/role";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().optional(),
  roles: z.array(z.number()).optional(),
});

export default function Users() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: usersData, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
  });

  const users = usersData?.data ?? [];

  const { data: rolesData = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => listRoles(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserDto) => createUser(payload),
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialogOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: () => toast.error("Erro ao criar usuário."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDto }) => updateUser(id, data),
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDialogOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: () => toast.error("Erro ao atualizar usuário."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Erro ao excluir usuário."),
  });

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      roles: [],
    },
  });

  const handleAdd = () => {
    setEditingUser(null);
    form.reset({
      name: "",
      email: "",
      username: "",
      password: "",
      roles: [],
    });
    setDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email ?? "",
      username: user.username,
      password: "",
      roles: user.roles.map((r) => r.id),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => deleteMutation.mutate(id);

  const onSubmit = (data: z.infer<typeof userSchema>) => {
    if (editingUser) {
      const payload: UpdateUserDto = {
        name: data.name,
        email: data.email,
        username: data.username,
        roles: data.roles ?? [],
      };
      if (data.password?.trim()) payload.password = data.password;
      updateMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      const payload: CreateUserDto = {
        name: data.name,
        email: data.email,
        username: data.username,
        password: data.password ?? "",
        roles: data.roles ?? [],
      };
      createMutation.mutate(payload);
    }
  };

  const columns = [
    { key: "name", header: "Nome" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Perfis",
      render: (user: User) => (
        <div className="flex flex-wrap gap-1">
          {(user.roles ?? []).map((role) => (
            <Badge key={role.id} variant="outline">
              {role.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (user: User) => (
        <div className="flex gap-2">
          {can("users", "update") && (
            <Button variant="ghost" size={isMobile ? "sm" : "icon"} onClick={() => handleEdit(user)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can("users", "delete") && (
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={() => handleDelete(user.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <p>Carregando usuários...</p>;
  if (isError) return <p className="text-destructive">Erro ao carregar usuários.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        {can("users", "create") && (
          <Button className={cn("shadow-md", isMobile && "w-full")} onClick={handleAdd}>
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            form.reset({
              name: "",
              email: "",
              username: "",
              password: "",
              roles: [],
            });
          }
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto",
            isMobile ? "w-[95vw] max-w-full p-4" : "max-w-4xl"
          )}
        >
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do usuário e defina seus perfis de acesso.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome de usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Senha do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfis de Acesso</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            "w-full",
                            !field.value?.length && "text-muted-foreground"
                          )}
                        >
                          {field.value?.length
                            ? `${field.value.length} perfil${
                                field.value.length > 1 ? "es" : ""
                              } selecionado${field.value.length > 1 ? "s" : ""}`
                            : "Selecionar perfis"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className={cn("p-0", isMobile ? "w-[90vw]" : "w-[300px]")}
                      >
                        <Command>
                          <CommandInput placeholder="Buscar perfil..." />
                          <CommandList>
                            <CommandEmpty>Nenhum perfil encontrado.</CommandEmpty>
                            <CommandGroup>
                              {rolesData.map((role: Role) => {
                                const isSelected = field.value?.includes(role.id);
                                return (
                                  <CommandItem
                                    key={role.id}
                                    onSelect={() => {
                                      const newRoles = isSelected
                                        ? field.value.filter((id) => id !== role.id)
                                        : [...(field.value || []), role.id];
                                      field.onChange(newRoles);
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        isSelected &&
                                          "bg-primary text-primary-foreground"
                                      )}
                                    >
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    {role.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter
                className={cn(isMobile && "flex-col space-y-2", "pt-2")}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className={cn(isMobile && "w-full")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className={cn(isMobile && "w-full")}
                >
                  {editingUser ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
