// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useQuery } from "@tanstack/react-query";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { DataTable } from "@/components/DataTable";
// import { Plus, Edit, Trash2 } from "lucide-react";
// import { usePermission } from "@/hooks/usePermission";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { toast } from "sonner";
// import { listProfessionals, createProfessional, updateProfessional, removeProfessional } from "@/services/professionalsService";
// import { listUsers } from "@/services/userService";
// import type { Professional, CreateProfessionalDto } from "@/types/professional";
// import type { User } from "@/types/user";
// import { WorkScheduleDay } from "@/types/work-schedule";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { cn } from "@/lib/utils";
// import { formatPhone } from '@/utils/formatters';

// const mockServices = [
//   { id: "cabelereira", name: "Cabelereira" },
//   { id: "manicure", name: "Manicure" },
//   { id: "nail-design", name: "Nail design" },
//   { id: "lash-design", name: "Lash design" },
//   { id: "design-sobrancelha", name: "Design de sobrancelha" },
//   { id: "adm", name: "ADM" },
//   { id: "ceo", name: "CEO" },
// ];

// const defaultSpecialtiesByUserName: Record<string, string[]> = {
//   "Carla": ["Cabelereira"],
//   "Maria": ["Manicure", "Cabelereira"],
//   "Agela": ["Lash design", "Design de sobrancelha"],
//   "Thay": ["Nail design", "Manicure"],
//   "Claudia": ["Nail design"],
//   "Geluce": ["Manicure"],
//   "Jammily": ["ADM"],
//   "Melissa": ["ADM"],
//   "Symon": ["ADM"],
//   "Michele": ["CEO", "Nail design"],
// };

// const defaultSchedule: WorkScheduleDay[] = [
//   { day: "Segunda-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
//   { day: "Terça-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
//   { day: "Quarta-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
//   { day: "Quinta-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
//   { day: "Sexta-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "17:00", lunchStart: "12:00", lunchEnd: "13:00" },
//   { day: "Sábado", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "16:00", lunchStart: "12:00", lunchEnd: "13:00" },
//   { day: "Domingo", isWorkingDay: false, isDayOff: true, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
// ];

// const professionalSchema = z.object({
//   user_id: z.number({ required_error: "Usuário é obrigatório" }),
//   phone: z.string().optional(),
//   specialties: z.array(z.string()).optional(),
//   active: z.boolean().default(true),
//   work_schedule: z
//     .array(
//       z.object({
//         day: z.string(),
//         isWorkingDay: z.boolean(),
//         isDayOff: z.boolean(),
//         startTime: z.string().nullable(),
//         endTime: z.string().nullable(),
//         lunchStart: z.string().nullable(),
//         lunchEnd: z.string().nullable(),
//       })
//     )
//     .default([]),
// });

// export default function Professionals() {
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
//   const [users, setUsers] = useState<User[]>([]);
//   const { can } = usePermission();
//   const isMobile = useIsMobile();

//   const { data: professionalsData, refetch, isLoading } = useQuery({
//     queryKey: ["professionals"],
//     queryFn: () => listProfessionals(),
//   });
//   const professionals = professionalsData?.data ?? [];


//   const form = useForm<z.infer<typeof professionalSchema>>({
//     resolver: zodResolver(professionalSchema),
//     defaultValues: {
//       user_id: undefined,
//       phone: "",
//       specialties: [],
//       active: true,
//       work_schedule: defaultSchedule,
//     },
//   });

//   const openDialog = async (professional?: Professional) => {
//     if (users.length === 0) {
//       try {
//         const userResponse = await listUsers({ perPage: 100 });
//         setUsers(userResponse.data);
//       } catch {
//         toast.error("Erro ao carregar usuários.");
//         return;
//       }
//     }

//     if (professional) {
//       form.reset({
//         user_id: professional.user_id ?? undefined,
//         phone: professional.phone ?? "",
//         specialties: professional.specialties ?? [],
//         active: professional.active ?? true,
//         work_schedule: professional.work_schedule ?? defaultSchedule,
//       });
//     } else {
//       form.reset({
//         user_id: undefined,
//         phone: "",
//         specialties: [],
//         active: true,
//         work_schedule: defaultSchedule,
//       });
//     }

//     setEditingProfessional(professional ?? null);
//     setDialogOpen(true);
//   };

//   const handleDelete = async (id: number) => {
//     try {
//       await removeProfessional(id);
//       toast.success("Profissional excluído com sucesso!");
//       refetch();
//     } catch {
//       toast.error("Erro ao excluir profissional.");
//     }
//   };

//   const onSubmit = async (data: z.infer<typeof professionalSchema>) => {
//     setIsSubmitting(true);
//     const payload: CreateProfessionalDto = {
//       user_id: data.user_id,
//       phone: data.phone ?? null,
//       specialties: data.specialties ?? [],
//       active: data.active ?? true,
//       work_schedule: data.work_schedule as WorkScheduleDay[],
//     };

//     try {
//       if (editingProfessional) {
//         await updateProfessional(editingProfessional.id, payload);
//         toast.success("Profissional atualizado com sucesso!");
//       } else {
//         await createProfessional(payload);
//         toast.success("Profissional criado com sucesso!");
//       }

//       refetch();
//       setDialogOpen(false);
//     } catch {
//       toast.error("Erro ao salvar profissional.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const columns = [
//     {
//       key: "user",
//       header: "Usuário",
//       render: (p: Professional) => p.name ?? "-",
//     },
//     { key: "phone", header: "Telefone" },
//     {
//       key: "specialties",
//       header: "Especializações",
//       render: (p: Professional) => (
//         <div className="flex flex-wrap gap-1">
//           {(p.specialties ?? []).map((spec) => (
//             <Badge key={spec} variant="secondary">
//               {spec}
//             </Badge>
//           ))}
//         </div>
//       ),
//     },
//     {
//       key: "active",
//       header: "Status",
//       render: (p: Professional) => (
//         <Badge variant={p.active ? "success" : "outline"}>
//           {p.active ? "Ativo" : "Inativo"}
//         </Badge>
//       ),
//     },
//     {
//       key: "actions",
//       header: "Ações",
//       render: (p: Professional) => (
//         <div className="flex gap-2">
//           {can("professionals", "update") && (
//             <Button variant="ghost" size="icon" onClick={() => openDialog(p)}>
//               <Edit className="h-4 w-4" />
//             </Button>
//           )}
//           {can("professionals", "delete") && (
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => handleDelete(p.id)}
//             >
//               <Trash2 className="h-4 w-4 text-destructive" />
//             </Button>
//           )}
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-wrap items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
//           <p className="text-muted-foreground">Gerencie os profissionais do salão</p>
//         </div>
//         {can("professionals", "create") && (
//           <Button className={cn("shadow-md", isMobile && "w-full")} onClick={() => openDialog()}>
//             <Plus className="mr-2 h-4 w-4" />
//             Novo Profissional
//           </Button>
//         )}
//       </div>

//       <DataTable
//         data={professionals}
//         columns={columns}
//         loading={isLoading}
//         searchPlaceholder="Buscar profissionais..."
//         emptyMessage="Nenhum profissional encontrado."
//       />

//       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//         <DialogContent
//           className={isMobile ? "max-w-[95vw] h-[90vh] overflow-y-auto" : "max-w-4xl max-h-[90vh] overflow-y-auto"}
//         >
//           <DialogHeader>
//             <DialogTitle>
//               {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
//             </DialogTitle>
//             <DialogDescription>
//               Selecione o usuário, defina as especializações e configure o horário de trabalho.
//             </DialogDescription>
//           </DialogHeader>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <FormField
//                 control={form.control}
//                 name="user_id"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Usuário do Sistema</FormLabel>
//                     <FormControl>
//                       <Select
//                         value={field.value ? String(field.value) : ""}
//                         onValueChange={(val) => field.onChange(Number(val))}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Selecione um usuário" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {users.length === 0 ? (
//                             <div className="p-2 text-sm text-muted-foreground">
//                               Carregando usuários...
//                             </div>
//                           ) : (
//                             users.map((user) => (
//                               <SelectItem key={user.id} value={String(user.id)}>
//                                 {user.name} ({user.email})
//                               </SelectItem>
//                             ))
//                           )}
//                         </SelectContent>
//                       </Select>
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="phone"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Telefone</FormLabel>
//                     <FormControl>
//                       <Input
//                         placeholder="(81) 90011-2233"
//                         value={field.value || ''}
//                         onChange={(e) => field.onChange(formatPhone(e.target.value))}
//                         maxLength={15}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="specialties"
//                 render={() => (
//                   <FormItem>
//                     <FormLabel>Especializações / Serviços</FormLabel>
//                     <div className="grid grid-cols-2 gap-3 mt-2 sm:grid-cols-3">
//                       {mockServices.map((service) => (
//                         <FormField
//                           key={service.id}
//                           control={form.control}
//                           name="specialties"
//                           render={({ field }) => (
//                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
//                               <FormControl>
//                                 <Checkbox
//                                   checked={field.value?.includes(service.name)}
//                                   onCheckedChange={(checked) =>
//                                     checked
//                                       ? field.onChange([
//                                           ...(field.value ?? []),
//                                           service.name,
//                                         ])
//                                       : field.onChange(
//                                           field.value?.filter(
//                                             (v) => v !== service.name
//                                           )
//                                         )
//                                   }
//                                 />
//                               </FormControl>
//                               <FormLabel className="font-normal">
//                                 {service.name}
//                               </FormLabel>
//                             </FormItem>
//                           )}
//                         />
//                       ))}
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="active"
//                 render={({ field }) => (
//                   <FormItem className="flex items-center justify-between border p-3 rounded-lg">
//                     <FormLabel>Status do Profissional</FormLabel>
//                     <FormControl>
//                       <Checkbox
//                         checked={field.value}
//                         onCheckedChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />

//               <div className="space-y-4 border-t pt-4">
//                 <FormLabel className="text-base">Horário de Trabalho</FormLabel>
//                 {form.watch("work_schedule")?.map((day, index) => (
//                   <div key={day.day} className="border rounded-lg p-4 space-y-3">
//                     <div className="flex items-center justify-between flex-wrap gap-2">
//                       <FormLabel className="text-sm font-medium">{day.day}</FormLabel>
//                       <div className="flex gap-4 flex-wrap">
//                         <FormField
//                           control={form.control}
//                           name={`work_schedule.${index}.isWorkingDay`}
//                           render={({ field }) => (
//                             <FormItem className="flex flex-row items-center space-x-2">
//                               <FormControl>
//                                 <Checkbox
//                                   checked={field.value}
//                                   onCheckedChange={field.onChange}
//                                 />
//                               </FormControl>
//                               <FormLabel className="text-xs font-normal">
//                                 Dia útil
//                               </FormLabel>
//                             </FormItem>
//                           )}
//                         />
//                         <FormField
//                           control={form.control}
//                           name={`work_schedule.${index}.isDayOff`}
//                           render={({ field }) => (
//                             <FormItem className="flex flex-row items-center space-x-2">
//                               <FormControl>
//                                 <Checkbox
//                                   checked={field.value}
//                                   onCheckedChange={field.onChange}
//                                 />
//                               </FormControl>
//                               <FormLabel className="text-xs font-normal">
//                                 Folga
//                               </FormLabel>
//                             </FormItem>
//                           )}
//                         />
//                       </div>
//                     </div>

//                     {form.watch(`work_schedule.${index}.isWorkingDay`) &&
//                       !form.watch(`work_schedule.${index}.isDayOff`) && (
//                         <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
//                           {["startTime", "endTime", "lunchStart", "lunchEnd"].map((key, i) => (
//                             <FormField
//                               key={key}
//                               control={form.control}
//                               name={`work_schedule.${index}.${key}` as any}
//                               render={({ field }) => (
//                                 <FormItem>
//                                   <FormLabel className="text-xs text-muted-foreground">
//                                     {["Entrada", "Saída", "Início do Almoço", "Fim do Almoço"][i]}
//                                   </FormLabel>
//                                   <FormControl>
//                                     <Input type="time" value={field.value ?? ""} onChange={field.onChange} />
//                                   </FormControl>
//                                 </FormItem>
//                               )}
//                             />
//                           ))}
//                         </div>
//                       )}
//                   </div>
//                 ))}
//               </div>

//               <DialogFooter>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setDialogOpen(false)}
//                 >
//                   Cancelar
//                 </Button>
//                 <Button type="submit" disabled={isSubmitting}>
//                   {isSubmitting
//                     ? "Salvando..."
//                     : editingProfessional
//                     ? "Atualizar"
//                     : "Cadastrar"}
//                 </Button>
//               </DialogFooter>
//             </form>
//           </Form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2 } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { listProfessionals, createProfessional, updateProfessional, removeProfessional } from "@/services/professionalsService";
import { listUsers } from "@/services/userService";
import type { Professional, CreateProfessionalDto } from "@/types/professional";
import type { User } from "@/types/user";
import { WorkScheduleDay } from "@/types/work-schedule";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatPhone } from '@/utils/formatters';

const mockServices = [
  { id: "cabelereira", name: "Cabelereira" },
  { id: "manicure", name: "Manicure" },
  { id: "nail-design", name: "Nail design" },
  { id: "lash-design", name: "Lash design" },
  { id: "design-sobrancelha", name: "Design de sobrancelha" },
  { id: "adm", name: "ADM" },
  { id: "ceo", name: "CEO" },
];

const defaultSpecialtiesByUserName: Record<string, string[]> = {
  "Carla": ["Cabelereira"],
  "Maria": ["Manicure", "Cabelereira"],
  "Agela": ["Lash design", "Design de sobrancelha"],
  "Thay": ["Nail design", "Manicure"],
  "Claudia": ["Nail design"],
  "Geluce": ["Manicure"],
  "Jammily": ["ADM"],
  "Melissa": ["ADM"],
  "Symon": ["ADM"],
  "Michele": ["CEO", "Nail design"],
};

const defaultSchedule: WorkScheduleDay[] = [
  { day: "Segunda-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
  { day: "Terça-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
  { day: "Quarta-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
  { day: "Quinta-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
  { day: "Sexta-feira", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "17:00", lunchStart: "12:00", lunchEnd: "13:00" },
  { day: "Sábado", isWorkingDay: true, isDayOff: false, startTime: "09:00", endTime: "16:00", lunchStart: "12:00", lunchEnd: "13:00" },
  { day: "Domingo", isWorkingDay: false, isDayOff: true, startTime: "09:00", endTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
];

const professionalSchema = z.object({
  user_id: z.number({ required_error: "Usuário é obrigatório" }),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  active: z.boolean().default(true),
  work_schedule: z
    .array(
      z.object({
        day: z.string(),
        isWorkingDay: z.boolean(),
        isDayOff: z.boolean(),
        startTime: z.string().nullable(),
        endTime: z.string().nullable(),
        lunchStart: z.string().nullable(),
        lunchEnd: z.string().nullable(),
      })
    )
    .default([]),
});

export default function Professionals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { can } = usePermission();
  const isMobile = useIsMobile();

  const { data: professionalsData, refetch, isLoading } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => listProfessionals(),
  });
  const professionals = professionalsData?.data ?? [];


  const form = useForm<z.infer<typeof professionalSchema>>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      user_id: undefined,
      phone: "",
      specialties: [],
      active: true,
      work_schedule: defaultSchedule,
    },
  });

  const openDialog = async (professional?: Professional) => {
    if (users.length === 0) {
      try {
        const userResponse = await listUsers({ perPage: 100 });
        setUsers(userResponse.data);
      } catch {
        toast.error("Erro ao carregar usuários.");
        return;
      }
    }

    if (professional) {
      form.reset({
        user_id: professional.user_id ?? undefined,
        phone: professional.phone ?? "",
        specialties: professional.specialties ?? [],
        active: professional.active ?? true,
        work_schedule: professional.work_schedule ?? defaultSchedule,
      });
    } else {
      form.reset({
        user_id: undefined,
        phone: "",
        specialties: [],
        active: true,
        work_schedule: defaultSchedule,
      });
    }

    setEditingProfessional(professional ?? null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await removeProfessional(id);
      toast.success("Profissional excluído com sucesso!");
      refetch();
    } catch {
      toast.error("Erro ao excluir profissional.");
    }
  };

  const onSubmit = async (data: z.infer<typeof professionalSchema>) => {
    setIsSubmitting(true);
    const payload: CreateProfessionalDto = {
      user_id: data.user_id,
      phone: data.phone ?? null,
      specialties: data.specialties ?? [],
      active: data.active ?? true,
      work_schedule: data.work_schedule as WorkScheduleDay[],
    };

    try {
      if (editingProfessional) {
        await updateProfessional(editingProfessional.id, payload);
        toast.success("Profissional atualizado com sucesso!");
      } else {
        await createProfessional(payload);
        toast.success("Profissional criado com sucesso!");
      }

      refetch();
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar profissional.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "user",
      header: "Usuário",
      render: (p: Professional) => p.name ?? "-",
    },
    { key: "phone", header: "Telefone" },
    {
      key: "specialties",
      header: "Especializações",
      render: (p: Professional) => (
        <div className="flex flex-wrap gap-1">
          {(p.specialties ?? []).map((spec) => (
            <Badge key={spec} variant="secondary">
              {spec}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (p: Professional) => (
        <Badge variant={p.active ? "success" : "outline"}>
          {p.active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (p: Professional) => (
        <div className="flex gap-2">
          {can("professionals", "update") && (
            <Button variant="ghost" size="icon" onClick={() => openDialog(p)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {can("professionals", "delete") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(p.id)}
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profissionais</h1>
          <p className="text-muted-foreground">Gerencie os profissionais do salão</p>
        </div>
        {can("professionals", "create") && (
          <Button className={cn("shadow-md", isMobile && "w-full")} onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        )}
      </div>

      <DataTable
        data={professionals}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Buscar profissionais..."
        emptyMessage="Nenhum profissional encontrado."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={isMobile ? "max-w-[95vw] h-[90vh] overflow-y-auto" : "max-w-4xl max-h-[90vh] overflow-y-auto"}
        >
          <DialogHeader>
            <DialogTitle>
              {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
            </DialogTitle>
            <DialogDescription>
              Selecione o usuário, defina as especializações e configure o horário de trabalho.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário do Sistema</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) => {
                          const userId = Number(val);
                          field.onChange(userId);

                          const selectedUser = users.find((u) => u.id === userId);
                          if (selectedUser) {
                            const defaults =
                              defaultSpecialtiesByUserName[selectedUser.name] ?? [];
                            form.setValue("specialties", defaults);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              Carregando usuários...
                            </div>
                          ) : (
                            users.map((user) => (
                              <SelectItem key={user.id} value={String(user.id)}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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
                      <Input
                        placeholder="(81) 90011-2233"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialties"
                render={() => (
                  <FormItem>
                    <FormLabel>Especializações / Serviços</FormLabel>
                    <div className="grid grid-cols-2 gap-3 mt-2 sm:grid-cols-3">
                      {mockServices.map((service) => (
                        <FormField
                          key={service.id}
                          control={form.control}
                          name="specialties"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.name)}
                                  onCheckedChange={(checked) =>
                                    checked
                                      ? field.onChange([
                                          ...(field.value ?? []),
                                          service.name,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (v) => v !== service.name
                                          )
                                        )
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {service.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border p-3 rounded-lg">
                    <FormLabel>Status do Profissional</FormLabel>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4 border-t pt-4">
                <FormLabel className="text-base">Horário de Trabalho</FormLabel>
                {form.watch("work_schedule")?.map((day, index) => (
                  <div key={day.day} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <FormLabel className="text-sm font-medium">{day.day}</FormLabel>
                      <div className="flex gap-4 flex-wrap">
                        <FormField
                          control={form.control}
                          name={`work_schedule.${index}.isWorkingDay`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">
                                Dia útil
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`work_schedule.${index}.isDayOff`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">
                                Folga
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {form.watch(`work_schedule.${index}.isWorkingDay`) &&
                      !form.watch(`work_schedule.${index}.isDayOff`) && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {["startTime", "endTime", "lunchStart", "lunchEnd"].map((key, i) => (
                            <FormField
                              key={key}
                              control={form.control}
                              name={`work_schedule.${index}.${key}` as any}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs text-muted-foreground">
                                    {["Entrada", "Saída", "Início do Almoço", "Fim do Almoço"][i]}
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="time" value={field.value ?? ""} onChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Salvando..."
                    : editingProfessional
                    ? "Atualizar"
                    : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
