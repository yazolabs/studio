import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface WorkSchedule {
  dayOfWeek: string;
  isWorkingDay: boolean;
  isDayOff: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

const defaultSchedule: WorkSchedule[] = [
  { dayOfWeek: 'Segunda-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Terça-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Quarta-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Quinta-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Sexta-feira', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '14:00', afternoonEnd: '18:00' },
  { dayOfWeek: 'Sábado', isWorkingDay: true, isDayOff: false, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '', afternoonEnd: '' },
  { dayOfWeek: 'Domingo', isWorkingDay: false, isDayOff: true, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
];

const professionalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  services: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
  schedule: z.array(z.object({
    dayOfWeek: z.string(),
    isWorkingDay: z.boolean(),
    isDayOff: z.boolean(),
    morningStart: z.string(),
    morningEnd: z.string(),
    afternoonStart: z.string(),
    afternoonEnd: z.string(),
  })),
});

interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
  schedule: WorkSchedule[];
  status: 'active' | 'inactive';
}

const mockServices = [
  { id: '1', name: 'Corte Feminino' },
  { id: '2', name: 'Corte Masculino' },
  { id: '3', name: 'Manicure' },
  { id: '4', name: 'Pedicure' },
  { id: '5', name: 'Massagem' },
  { id: '6', name: 'Escova' },
  { id: '7', name: 'Coloração' },
  { id: '8', name: 'Hidratação' },
];

const mockProfessionals: Professional[] = [
  {
    id: '1',
    name: 'Maria Santos',
    email: 'maria@salao.com',
    phone: '(11) 98765-4321',
    services: ['1', '6', '7', '8'],
    schedule: defaultSchedule,
    status: 'active',
  },
  {
    id: '2',
    name: 'João Pedro',
    email: 'joao@salao.com',
    phone: '(11) 98765-4322',
    services: ['2'],
    schedule: defaultSchedule,
    status: 'active',
  },
  {
    id: '3',
    name: 'Paula Costa',
    email: 'paula@salao.com',
    phone: '(11) 98765-4323',
    services: ['3', '4'],
    schedule: defaultSchedule,
    status: 'active',
  },
  {
    id: '4',
    name: 'Rita Moura',
    email: 'rita@salao.com',
    phone: '(11) 98765-4324',
    services: ['5'],
    schedule: defaultSchedule,
    status: 'active',
  },
];

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>(mockProfessionals);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const { can } = usePermission();

  const form = useForm<z.infer<typeof professionalSchema>>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      services: [],
      schedule: defaultSchedule,
    },
  });

  const handleAdd = () => {
    setEditingProfessional(null);
    form.reset({
      name: '',
      email: '',
      phone: '',
      services: [],
      schedule: defaultSchedule,
    });
    setDialogOpen(true);
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    form.reset({
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      services: professional.services,
      schedule: professional.schedule || defaultSchedule,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProfessionals(professionals.filter((p) => p.id !== id));
    toast.success('Profissional removido com sucesso!');
  };

  const onSubmit = (data: z.infer<typeof professionalSchema>) => {
    if (editingProfessional) {
      setProfessionals(
        professionals.map((p) =>
          p.id === editingProfessional.id
            ? { 
                ...p, 
                name: data.name, 
                email: data.email, 
                phone: data.phone, 
                services: data.services, 
                schedule: data.schedule as WorkSchedule[]
              }
            : p
        )
      );
      toast.success('Profissional atualizado com sucesso!');
    } else {
      const newProfessional: Professional = {
        id: String(professionals.length + 1),
        name: data.name,
        email: data.email,
        phone: data.phone,
        services: data.services,
        schedule: data.schedule as WorkSchedule[],
        status: 'active',
      };
      setProfessionals([...professionals, newProfessional]);
      toast.success('Profissional cadastrado com sucesso!');
    }
    setDialogOpen(false);
    form.reset();
  };

  const getServiceNames = (serviceIds: string[]) => {
    return serviceIds
      .map((id) => mockServices.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Telefone' },
    {
      key: 'services',
      header: 'Especializações',
      render: (professional: Professional) => (
        <div className="flex flex-wrap gap-1">
          {professional.services.slice(0, 2).map((serviceId) => {
            const service = mockServices.find((s) => s.id === serviceId);
            return service ? (
              <Badge key={serviceId} variant="secondary">
                {service.name}
              </Badge>
            ) : null;
          })}
          {professional.services.length > 2 && (
            <Badge variant="outline">+{professional.services.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (professional: Professional) => (
        <Badge variant={professional.status === 'active' ? 'success' : 'outline'}>
          {professional.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (professional: Professional) => (
        <div className="flex gap-2">
          {can('professionals', 'edit') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(professional)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('professionals', 'delete') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(professional.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais e suas especializações
          </p>
        </div>
        {can('professionals', 'create') && (
          <Button className="shadow-md" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        )}
      </div>

      <DataTable
        data={professionals}
        columns={columns}
        searchPlaceholder="Buscar profissionais..."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do profissional, selecione os serviços e configure os horários de atendimento.
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
                      <Input placeholder="Nome do profissional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 98765-4321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="services"
                render={() => (
                  <FormItem>
                    <FormLabel>Especializações / Serviços Habilitados</FormLabel>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {mockServices.map((service) => (
                        <FormField
                          key={service.id}
                          control={form.control}
                          name="services"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={service.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(service.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, service.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== service.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {service.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border-t pt-4">
                <FormLabel className="text-base">Horários de Atendimento</FormLabel>
                {form.watch('schedule')?.map((day, index) => (
                  <div key={day.dayOfWeek} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">{day.dayOfWeek}</FormLabel>
                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name={`schedule.${index}.isWorkingDay`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">Dia útil</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`schedule.${index}.isDayOff`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">Folga</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {form.watch(`schedule.${index}.isWorkingDay`) && !form.watch(`schedule.${index}.isDayOff`) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <FormLabel className="text-xs text-muted-foreground">Manhã</FormLabel>
                          <div className="flex gap-2">
                            <FormField
                              control={form.control}
                              name={`schedule.${index}.morningStart`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-muted-foreground self-center">às</span>
                            <FormField
                              control={form.control}
                              name={`schedule.${index}.morningEnd`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <FormLabel className="text-xs text-muted-foreground">Tarde</FormLabel>
                          <div className="flex gap-2">
                            <FormField
                              control={form.control}
                              name={`schedule.${index}.afternoonStart`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-muted-foreground self-center">às</span>
                            <FormField
                              control={form.control}
                              name={`schedule.${index}.afternoonEnd`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProfessional ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
