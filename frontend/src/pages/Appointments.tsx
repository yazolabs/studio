import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/DataTable';
import { Plus, Edit, Trash2, DollarSign, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { AppointmentCheckoutDialog } from '@/components/AppointmentCheckoutDialog';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number; // em minutos
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  price?: number;
}

const appointmentSchema = z.object({
  client: z.string().trim().min(1, 'Cliente é obrigatório').max(100, 'Nome muito longo'),
  clientPhone: z.string().trim().max(20, 'Telefone muito longo').optional(),
  service: z.string().min(1, 'Serviço é obrigatório'),
  professionals: z.array(z.string()).min(1, 'Selecione pelo menos um profissional'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  time: z.string().min(1, 'Horário é obrigatório'),
  duration: z.coerce.number().min(15, 'Duração mínima de 15 minutos').optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']),
  notes: z.string().trim().max(500, 'Observações muito longas').optional(),
  price: z.coerce.number().min(0, 'Preço inválido').optional(),
});

const mockProfessionals = [
  { id: '1', name: 'Maria Santos' },
  { id: '2', name: 'João Pedro' },
  { id: '3', name: 'Paula Costa' },
  { id: '4', name: 'Rita Moura' },
];

const mockServices = [
  { id: '1', name: 'Corte Feminino', duration: 60, price: 80 },
  { id: '2', name: 'Corte Masculino', duration: 45, price: 50 },
  { id: '3', name: 'Manicure', duration: 30, price: 35 },
  { id: '4', name: 'Pedicure', duration: 45, price: 45 },
  { id: '5', name: 'Massagem', duration: 90, price: 120 },
  { id: '6', name: 'Coloração', duration: 120, price: 200 },
];

const mockAppointments: Appointment[] = [
  { 
    id: '1', 
    client: 'Ana Silva', 
    clientPhone: '(11) 98765-4321',
    service: 'Corte Feminino', 
    professionals: ['1'], 
    date: '2025-10-15', 
    time: '14:00', 
    duration: 60,
    status: 'scheduled',
    price: 80,
    notes: 'Cliente prefere franja reta'
  },
  { 
    id: '2', 
    client: 'Carlos Souza', 
    service: 'Corte Masculino', 
    professionals: ['2'], 
    date: '2025-10-15', 
    time: '15:00', 
    duration: 45,
    status: 'confirmed',
    price: 50
  },
  { 
    id: '3', 
    client: 'Beatriz Lima', 
    service: 'Manicure', 
    professionals: ['3'], 
    date: '2025-10-15', 
    time: '16:00', 
    duration: 30,
    status: 'completed',
    price: 35
  },
  { 
    id: '4', 
    client: 'Diego Alves', 
    service: 'Massagem', 
    professionals: ['4', '1'], 
    date: '2025-10-16', 
    time: '10:00', 
    duration: 90,
    status: 'cancelled',
    price: 120
  },
];

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [checkoutAppointment, setCheckoutAppointment] = useState<Appointment | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null);
  const { can } = usePermission();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      client: '',
      clientPhone: '',
      service: '',
      professionals: [],
      time: '',
      duration: undefined,
      status: 'scheduled',
      notes: '',
      price: undefined,
    },
  });

  const handleOpenDialog = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      form.reset({
        client: appointment.client,
        clientPhone: appointment.clientPhone || '',
        service: appointment.service,
        professionals: appointment.professionals,
        date: new Date(appointment.date),
        time: appointment.time,
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes || '',
        price: appointment.price,
      });
    } else {
      setEditingAppointment(null);
      form.reset({
        client: '',
        clientPhone: '',
        service: '',
        professionals: [],
        time: '',
        duration: undefined,
        status: 'scheduled',
        notes: '',
        price: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppointment(null);
    form.reset();
  };

  const onSubmit = (data: z.infer<typeof appointmentSchema>) => {
    const formattedDate = format(data.date, 'yyyy-MM-dd');
    
    if (editingAppointment) {
      setAppointments(appointments.map(apt => 
        apt.id === editingAppointment.id 
          ? {
              ...apt,
              client: data.client,
              clientPhone: data.clientPhone,
              service: data.service,
              professionals: data.professionals,
              date: formattedDate,
              time: data.time,
              duration: data.duration,
              status: data.status,
              notes: data.notes,
              price: data.price,
            }
          : apt
      ));
      toast({
        title: 'Agendamento atualizado',
        description: 'Agendamento atualizado com sucesso.',
      });
    } else {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        client: data.client,
        clientPhone: data.clientPhone,
        service: data.service,
        professionals: data.professionals,
        date: formattedDate,
        time: data.time,
        duration: data.duration,
        status: data.status,
        notes: data.notes,
        price: data.price,
      };
      setAppointments([...appointments, newAppointment]);
      toast({
        title: 'Agendamento criado',
        description: 'Novo agendamento adicionado com sucesso.',
      });
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setDeletingAppointmentId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingAppointmentId) {
      setAppointments(appointments.filter(apt => apt.id !== deletingAppointmentId));
      toast({
        title: 'Agendamento excluído',
        description: 'Agendamento removido com sucesso.',
      });
    }
    setIsDeleteDialogOpen(false);
    setDeletingAppointmentId(null);
  };

  const handleCheckout = (appointment: Appointment) => {
    setCheckoutAppointment(appointment);
    setCheckoutDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const printAppointmentReceipt = (appointment: Appointment) => {
    const professionalNames = appointment.professionals
      .map((id) => mockProfessionals.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const date = new Date(appointment.date);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'long',
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a janela de impressão. Verifique se pop-ups não estão bloqueados.',
        variant: 'destructive',
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Comanda - ${appointment.client}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.6;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #e63888;
            }
            
            .header h1 {
              color: #e63888;
              font-size: 28px;
              margin-bottom: 10px;
            }
            
            .header p {
              color: #666;
              font-size: 14px;
            }
            
            .section {
              margin-bottom: 25px;
            }
            
            .section-title {
              background-color: #e63888;
              color: white;
              padding: 8px 12px;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 12px;
              border-radius: 4px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .info-item {
              padding: 10px;
              background-color: #f8f9fa;
              border-left: 3px solid #e63888;
              border-radius: 4px;
            }
            
            .info-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
              font-weight: 600;
            }
            
            .info-value {
              font-size: 16px;
              color: #333;
              font-weight: 500;
            }
            
            .full-width {
              grid-column: 1 / -1;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 600;
            }
            
            .status-scheduled {
              background-color: #fef3c7;
              color: #92400e;
            }
            
            .status-confirmed {
              background-color: #dbeafe;
              color: #1e40af;
            }
            
            .status-completed {
              background-color: #d1fae5;
              color: #065f46;
            }
            
            .status-cancelled {
              background-color: #fee2e2;
              color: #991b1b;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #ccc;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            
            .price-highlight {
              font-size: 24px;
              color: #e63888;
              font-weight: bold;
            }
            
            .notes-box {
              background-color: #fffbeb;
              border: 1px solid #fbbf24;
              padding: 12px;
              border-radius: 4px;
              font-size: 14px;
              color: #78350f;
            }
            
            @media print {
              body {
                padding: 10px;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌸 Studio Unhas Delicadas 🌸</h1>
            <p>Michele Fonseca e Equipe</p>
            <p style="margin-top: 10px; font-size: 16px; font-weight: 600;">COMANDA DE ATENDIMENTO</p>
          </div>

          <div class="section">
            <div class="section-title">Informações do Cliente</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Cliente</div>
                <div class="info-value">${appointment.client}</div>
              </div>
              ${appointment.clientPhone ? `
                <div class="info-item">
                  <div class="info-label">Telefone</div>
                  <div class="info-value">${appointment.clientPhone}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalhes do Agendamento</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Data</div>
                <div class="info-value">${formattedDate}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Horário</div>
                <div class="info-value">${appointment.time}</div>
              </div>
              ${appointment.duration ? `
                <div class="info-item">
                  <div class="info-label">Duração</div>
                  <div class="info-value">${appointment.duration} minutos</div>
                </div>
              ` : ''}
              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge status-${appointment.status}">
                    ${getStatusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Serviços e Profissionais</div>
            <div class="info-grid">
              <div class="info-item full-width">
                <div class="info-label">Serviço</div>
                <div class="info-value">${appointment.service}</div>
              </div>
              <div class="info-item full-width">
                <div class="info-label">Profissional(is)</div>
                <div class="info-value">${professionalNames || 'Não especificado'}</div>
              </div>
            </div>
          </div>

          ${appointment.price ? `
            <div class="section">
              <div class="section-title">Valores</div>
              <div class="info-item" style="text-align: center; padding: 20px;">
                <div class="info-label">Valor Total</div>
                <div class="price-highlight">R$ ${appointment.price.toFixed(2)}</div>
              </div>
            </div>
          ` : ''}

          ${appointment.notes ? `
            <div class="section">
              <div class="section-title">Observações</div>
              <div class="notes-box">
                ${appointment.notes}
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>Studio Unhas Delicadas - Michele Fonseca e Equipe</strong></p>
            <p>Comanda impressa em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p style="margin-top: 10px;">Obrigado pela preferência! 💅</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const columns = [
    { key: 'client', header: 'Cliente' },
    { key: 'service', header: 'Serviço' },
    {
      key: 'professionals',
      header: 'Profissionais',
      render: (appointment: Appointment) => {
        const professionalNames = appointment.professionals
          .map((id) => mockProfessionals.find((p) => p.id === id)?.name)
          .filter(Boolean);
        
        if (professionalNames.length === 0) return '-';
        if (professionalNames.length === 1) return professionalNames[0];
        
        return (
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{professionalNames[0]}</Badge>
            {professionalNames.length > 1 && (
              <Badge variant="outline">+{professionalNames.length - 1}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'date',
      header: 'Data',
      render: (appointment: Appointment) => {
        const date = new Date(appointment.date);
        return date.toLocaleDateString('pt-BR');
      },
    },
    { key: 'time', header: 'Horário' },
    {
      key: 'status',
      header: 'Status',
      render: (appointment: Appointment) => (
        <Badge variant={getStatusVariant(appointment.status)}>
          {getStatusLabel(appointment.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (appointment: Appointment) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => printAppointmentReceipt(appointment)}
            title="Imprimir Comanda"
          >
            <Printer className="h-4 w-4" />
          </Button>
          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') &&
            can('appointments', 'edit') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCheckout(appointment)}
                title="Finalizar Atendimento"
              >
                <DollarSign className="h-4 w-4 text-success" />
              </Button>
            )}
          {can('appointments', 'edit') && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleOpenDialog(appointment)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can('appointments', 'delete') && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDelete(appointment.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos do salão
          </p>
        </div>
        {can('appointments', 'create') && (
          <Button className="shadow-md" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        )}
      </div>

      <DataTable
        data={appointments}
        columns={columns}
        searchPlaceholder="Buscar agendamentos..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do agendamento. Campos marcados são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const service = mockServices.find(s => s.name === value);
                        if (service) {
                          form.setValue('duration', service.duration);
                          form.setValue('price', service.price);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockServices.map((service) => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name} - {service.duration}min - R$ {service.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="professionals"
                render={() => (
                  <FormItem>
                    <FormLabel>Profissionais *</FormLabel>
                    <div className="grid grid-cols-2 gap-4 border rounded-md p-4">
                      {mockProfessionals.map((professional) => (
                        <FormField
                          key={professional.id}
                          control={form.control}
                          name="professionals"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={professional.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(professional.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, professional.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== professional.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {professional.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (min)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Agendado</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações sobre o agendamento"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAppointment ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppointmentCheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        appointment={checkoutAppointment}
      />
    </div>
  );
}
