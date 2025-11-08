import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, Printer, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAppointmentCheckout } from '@/hooks/appointments/index';
import { useProfessionalsQuery } from '@/hooks/professionals/index';
import { useServicesQuery } from '@/hooks/services/index';
import { usePromotionsQuery } from '@/hooks/promotions/index';
import { useItemsQuery } from '@/hooks/items/index';

const checkoutSchema = z.object({
  discount: z.number().min(0).max(100),
  paymentMethod: z.string().min(1, 'Forma de pagamento é obrigatória'),
  cardBrand: z.string().optional(),
  installments: z.number().min(1).optional(),
  installmentFee: z.number().min(0).optional(),
});

interface Appointment {
  id: number;
  customer_id: number;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: number[];
  date: string;
  time: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
}

interface AppointmentLegacy {
  id: string;
  client: string;
  clientPhone?: string;
  service: string;
  professionals: string[];
  date: string;
  time: string;
  duration?: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
}

interface AppointmentCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | AppointmentLegacy | null;
}

export function AppointmentCheckoutDialog({
  open,
  onOpenChange,
  appointment,
}: AppointmentCheckoutDialogProps) {
  const { data: professionalsData } = useProfessionalsQuery();
  const { data: servicesData } = useServicesQuery();
  const { data: promotionsData } = usePromotionsQuery();
  const { data: itemsData } = useItemsQuery();
  const professionals = professionalsData?.data ?? [];
  const servicesList = servicesData ?? [];
  const promotions = promotionsData?.data ?? [];
  const productsList = itemsData?.data ?? [];
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessionals, setSelectedProfessionals] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedPromotion, setSelectedPromotion] = useState<string>('');

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      discount: 0,
      paymentMethod: '',
      cardBrand: '',
      installments: 1,
      installmentFee: 0,
    },
  });

  const { mutateAsync: checkout, isPending } = useAppointmentCheckout();

  const activePromotions = promotions.filter((promo: any) => {
    if (!promo.active) return false;
    const today = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    return today >= startDate && today <= endDate;
  });

  const handlePromotionChange = (promotionId: string) => {
    setSelectedPromotion(promotionId);
    if (promotionId && promotionId !== 'none') {
      const promotion = activePromotions.find((p: any) => p.id === promotionId);
      if (promotion?.discount_value) {
        form.setValue('discount', Number(promotion.discount_value));
      }
    } else {
      form.setValue('discount', 0);
    }
  };

  useEffect(() => {
    if (open && appointment) {
      setServices([]);
      setProducts([]);
      form.reset({
        discount: 0,
        paymentMethod: '',
        cardBrand: '',
        installments: 1,
        installmentFee: 0,
      });
    }
  }, [open, appointment, form]);

  const addService = () => {
    if (!selectedService || selectedProfessionals.length === 0) {
      toast.error('Selecione um serviço e pelo menos um profissional');
      return;
    }

    const service = servicesList.find((s: any) => s.id.toString() === selectedService);
    if (service) {
      setServices([
        ...services,
        {
          id: service.id,
          name: service.name,
          price: Number(service.price),
          commission_type: service.commission_type,
          commission_value: Number(service.commission_value),
          professionals: selectedProfessionals,
        },
      ]);
      setSelectedService('');
      setSelectedProfessionals([]);
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addProduct = () => {
    if (!selectedProduct || productQuantity < 1) {
      toast.error('Selecione um produto e quantidade válida');
      return;
    }

    const product = productsList.find((p: any) => p.id.toString() === selectedProduct);
    if (product) {
      const existing = products.find((p) => p.id === product.id);
      if (existing) {
        setProducts(
          products.map((p) =>
            p.id === product.id
              ? { ...p, quantity: p.quantity + productQuantity }
              : p
          )
        );
      } else {
        setProducts([
          ...products,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: productQuantity,
          },
        ]);
      }
      setSelectedProduct('');
      setProductQuantity(1);
    }
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const toggleProfessional = (id: number) => {
    if (selectedProfessionals.includes(id)) {
      setSelectedProfessionals(selectedProfessionals.filter((p) => p !== id));
    } else {
      setSelectedProfessionals([...selectedProfessionals, id]);
    }
  };

  const servicesTotal = services.reduce((sum, s) => sum + s.price, 0);
  const productsTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const subtotal = servicesTotal + productsTotal;
  const discount = form.watch('discount') || 0;
  const paymentMethod = form.watch('paymentMethod');
  const installments = form.watch('installments') || 1;
  const installmentFee = form.watch('installmentFee') || 0;

  let totalAfterDiscount = subtotal - (subtotal * discount) / 100;
  if (paymentMethod === 'credit' && installments > 1) {
    totalAfterDiscount = totalAfterDiscount + (totalAfterDiscount * installmentFee) / 100;
  }
  const total = totalAfterDiscount;

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (!appointment) return;
    if (services.length === 0) {
      toast.error('Adicione pelo menos um serviço');
      return;
    }

    try {
      await checkout({
        appointment,
        services: services.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          professionals: s.professionals,
          commission_type: s.commission_type,
          commission_value: s.commission_value,
        })),
      });

      toast.success(`Atendimento finalizado com sucesso!`);
      onOpenChange(false);
      setServices([]);
      setProducts([]);
      form.reset();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao finalizar atendimento.');
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Atendimento</DialogTitle>
          <DialogDescription>
            Cliente: {appointment.client} • {new Date(appointment.date).toLocaleDateString('pt-BR')} às{' '}
            {appointment.time}
          </DialogDescription>
        </DialogHeader>

        {activePromotions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Promoção/Campanha</h3>
            </div>
            <Select value={selectedPromotion} onValueChange={handlePromotionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma promoção (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma promoção</SelectItem>
                {activePromotions.map((promo: any) => (
                  <SelectItem key={promo.id} value={promo.id.toString()}>
                    <div className="flex items-center justify-between gap-3">
                      <span>{promo.name}</span>
                      {promo.discount_value && (
                        <Badge variant="secondary" className="ml-2">
                          {promo.discount_value}%
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPromotion && selectedPromotion !== 'none' && (
              <Alert className="border-success/50 bg-success/5">
                <AlertDescription className="text-sm text-success">
                  ✓ Promoção aplicada: {activePromotions.find((p: any) => p.id.toString() === selectedPromotion)?.description}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Serviços */}
        <div className="space-y-4 mt-6">
          <h3 className="font-semibold">Serviços Realizados</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicesList.map((s: any) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} - R$ {Number(s.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={addService}
              disabled={!selectedService || selectedProfessionals.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>

          {selectedService && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selecione os profissionais (pode selecionar múltiplos):
              </p>
              <div className="flex flex-wrap gap-2">
                {professionals.map((p: any) => (
                  <Badge
                    key={p.id}
                    variant={selectedProfessionals.includes(p.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleProfessional(p.id)}
                  >
                    {p.user?.name || p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {services.length > 0 && (
            <div className="space-y-2">
              {services.map((s, i) => (
                <div key={i} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Profissionais:{' '}
                      {s.professionals
                        .map((id: number) => professionals.find((p: any) => p.id === id)?.user?.name || '')
                        .join(', ')}
                    </p>
                    <p className="text-sm font-medium mt-1">R$ {s.price.toFixed(2)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Produtos */}
        <div className="space-y-4">
          <h3 className="font-semibold">Produtos Adquiridos</h3>
          <div className="grid grid-cols-3 gap-3">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {productsList.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name} - R$ {Number(p.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min="1"
              value={productQuantity}
              onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
              placeholder="Qtd"
            />

            <Button
              type="button"
              variant="outline"
              onClick={addProduct}
              disabled={!selectedProduct}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {products.length > 0 && (
            <div className="space-y-2">
              {products.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantidade: {p.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      R$ {(p.price * p.quantity).toFixed(2)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProduct(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Pagamento */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="font-semibold">Pagamento</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="credit">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {paymentMethod === 'credit' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Parcelas</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installmentFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acréscimo (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Serviços:</span>
                <span>R$ {servicesTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Produtos:</span>
                <span>R$ {productsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Desconto ({discount}%):</span>
                  <span>- R$ {((subtotal * discount) / 100).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Comanda
              </Button>
              <div className="flex gap-2 flex-1 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Finalizando...' : 'Finalizar Atendimento'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
