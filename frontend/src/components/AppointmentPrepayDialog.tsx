import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyInput, displayCurrency, formatPercentageInput, displayPercentage } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type PrepayPaymentOut = {
  method: string;
  amount: number;
  fee_percent: number;
  card_brand: string | null;
  installments: number | null;
  meta: Record<string, any> | null;
  notes: string | null;
};

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const paymentSchema = z
  .object({
    method: z.string().min(1, "Forma de pagamento é obrigatória"),
    amount: z.number().min(0, "Informe um valor válido"),
    card_brand: z.string().optional().nullable(),
    installments: z.number().min(1).optional().nullable(),
    fee_percent: z.number().min(0).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((p, ctx) => {
    const method = String(p.method || "").trim();

    const needsCardBrand = method === "debit" || method === "credit" || method === "credit_link";
    const isCredit = method === "credit";
    const isCreditLike = method === "credit" || method === "credit_link";

    if (needsCardBrand) {
      const brand = String(p.card_brand ?? "").trim();
      if (!brand) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["card_brand"],
          message: "Bandeira é obrigatória para pagamentos com cartão",
        });
      }
    }

    if (isCredit) {
      if (!p.installments || p.installments < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["installments"],
          message: "Parcelas obrigatórias no crédito",
        });
      }
    }

    if (isCreditLike) {
      if (p.fee_percent != null && p.fee_percent < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fee_percent"],
          message: "Taxa inválida",
        });
      }
    }
  });

const prepaySchema = z.object({
  payments: z.array(paymentSchema).min(1, "Adicione pelo menos 1 pagamento"),
});

interface AppointmentPrepayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  grossAmount?: number;
  discountLines?: Array<{ label: string; amount: number }>;
  defaultPayments?: Array<{
    method?: string;
    amount: number;
    notes?: string | null;
    card_brand?: string | null;
    installments?: number | null;
    fee_percent?: number | null;
    installment_fee?: number | null;
    meta?: Record<string, any> | null;
  }>;
  intent?: "paid" | "partial";
  onConfirm: (payments: PrepayPaymentOut[]) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function AppointmentPrepayDialog({
  open,
  onOpenChange,
  totalAmount,
  grossAmount,
  discountLines,
  defaultPayments,
  intent = "paid",
  onConfirm,
  onCancel,
  title,
  description,
}: AppointmentPrepayDialogProps) {
  const isMobile = useIsMobile();
  const didConfirmRef = useRef(false);

  const resolvedTitle =
    title ?? (intent === "partial" ? "Pagamento Parcial" : "Pagamento Antecipado");

  const resolvedDescription =
    description ??
    (intent === "partial"
      ? "Informe os pagamentos recebidos agora (valor menor que o total)."
      : "Informe a forma de pagamento para registrar no caixa.");

  const [paymentAmountDisplay, setPaymentAmountDisplay] = useState<Record<number, string>>({});
  const [paymentFeeDisplay, setPaymentFeeDisplay] = useState<Record<number, string>>({});

  const form = useForm<z.infer<typeof prepaySchema>>({
    resolver: zodResolver(prepaySchema),
    defaultValues: {
      payments: [
        {
          method: "",
          amount: 0,
          card_brand: null,
          installments: 1,
          fee_percent: 0,
          notes: null,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  function parseNumberBR(v: any, fallback = 0) {
    if (v == null) return fallback;
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback;

    const s = String(v).trim();
    if (!s) return fallback;

    const cleaned = s.replace(/[^\d.,-]/g, "");

    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const n = Number(normalized);
      return Number.isFinite(n) ? n : fallback;
    }

    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }

  useEffect(() => {
    if (!open) return;

    const fromApi = (defaultPayments ?? []).map((p) => {
      const method = String(p.method ?? "").trim();
      const feeRaw = p.fee_percent ?? p.installment_fee ?? 0;

      return {
        method,
        amount: parseNumberBR(p.amount, 0),
        card_brand: p.card_brand ?? null,
        installments: p.installments ?? 1,
        fee_percent: parseNumberBR(feeRaw, 0),
        notes: p.notes ?? null,
      };
    });

    const nextPayments =
      fromApi.length > 0
        ? fromApi
        : [
            {
              method: "",
              amount: 0,
              card_brand: null,
              installments: 1,
              fee_percent: 0,
              notes: null,
            },
          ];

    form.reset({ payments: nextPayments });

    const amountDisplayMap: Record<number, string> = {};
    const feeDisplayMap: Record<number, string> = {};

    nextPayments.forEach((p, i) => {
      amountDisplayMap[i] = p.amount ? displayCurrency(Number(p.amount)) : "";
      feeDisplayMap[i] = p.fee_percent ? displayPercentage(Number(p.fee_percent)) : "";
    });

    setPaymentAmountDisplay(amountDisplayMap);
    setPaymentFeeDisplay(feeDisplayMap);
  }, [open, defaultPayments, form]);

  const paymentsWatch = useWatch({ control: form.control, name: "payments" }) ?? [];

  const baseTotal = Number(Number(totalAmount ?? 0).toFixed(2));
  const isZeroBase = Math.abs(baseTotal) <= 0.0001;

  const safeDiscountLines = (discountLines ?? []).filter((l) => safeNumber(l.amount, 0) > 0);

  const discountTotalFromLines = Number(
    safeDiscountLines.reduce((sum, l) => sum + safeNumber(l.amount, 0), 0).toFixed(2)
  );

  const grossAmountSafe = Number(
    Number((grossAmount ?? (baseTotal + discountTotalFromLines)) ?? 0).toFixed(2)
  );

  const discountTotal = Number(
    Math.max(0, grossAmountSafe - baseTotal, discountTotalFromLines).toFixed(2)
  );

  const paidBaseTotal = Number(
    paymentsWatch.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)
  );

  const remaining = Number((baseTotal - paidBaseTotal).toFixed(2));

  const feeTotal = Number(
    (paymentsWatch ?? [])
      .reduce((sum, p) => {
        const method = String(p?.method || "").trim();
        if (method !== "credit" && method !== "credit_link") return sum;

        const base = safeNumber(p?.amount, 0);
        const feePercent = safeNumber(p?.fee_percent, 0);

        return sum + (base * feePercent) / 100;
      }, 0)
      .toFixed(2)
  );

  const feeLines =
    (paymentsWatch ?? [])
      .map((p, idx) => {
        const method = String(p?.method || "").trim();
        if (method !== "credit" && method !== "credit_link") return null;

        const base = safeNumber(p?.amount, 0);
        const feePercent = safeNumber(p?.fee_percent, 0);
        if (base <= 0 || feePercent <= 0) return null;

        const fee = Number(((base * feePercent) / 100).toFixed(2));
        if (fee <= 0) return null;

        const label =
          method === "credit_link"
            ? `Taxa (Link) • ${feePercent.toFixed(2)}%`
            : `Taxa (Crédito) • ${feePercent.toFixed(2)}%`;

        return { label: `${label} (pagamento ${idx + 1})`, amount: fee };
      })
      .filter(Boolean) as Array<{ label: string; amount: number }>;

  const fillRemainingOnRow = (index: number) => {
    const current = Number(form.getValues(`payments.${index}.amount`) || 0);
    const add = Math.max(0, remaining);
    const next = Number((current + add).toFixed(2));

    form.setValue(`payments.${index}.amount`, next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    setPaymentAmountDisplay((prev) => ({
      ...prev,
      [index]: next > 0 ? displayCurrency(next) : "",
    }));
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      if (didConfirmRef.current) {
        didConfirmRef.current = false;
        return;
      }
      onCancel();
    }
  };

  const onSubmit = async (data: z.infer<typeof prepaySchema>) => {
    const expectedBase = baseTotal;

    if (Math.abs(expectedBase) <= 0.0001) {
      didConfirmRef.current = true;
      onConfirm([]);
      onOpenChange(false);
      return;
    }

    const paidBase = Number(
      (data.payments ?? []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toFixed(2)
    );

    if (expectedBase < 0) {
      toast.error("Valor total inválido para pagamento.");
      return;
    }

    if (intent === "paid") {
      if (Math.abs(paidBase - expectedBase) > 0.01) {
        toast.error(
          `A soma dos pagamentos (R$ ${paidBase.toFixed(2)}) deve ser igual ao total (R$ ${expectedBase.toFixed(2)}).`
        );
        return;
      }
    } else {
      if (paidBase <= 0.009) {
        toast.error("No pagamento parcial, informe um valor maior que zero.");
        return;
      }
      if (paidBase >= expectedBase - 0.009) {
        toast.error(
          `No pagamento parcial, a soma dos pagamentos (R$ ${paidBase.toFixed(2)}) deve ser MENOR que o total (R$ ${expectedBase.toFixed(2)}).`
        );
        return;
      }
    }

    const payments: PrepayPaymentOut[] = (data.payments ?? []).map((p) => {
      const method = String(p.method || "").trim();
      const isCreditLike = method === "credit" || method === "credit_link";
      const isCard = isCreditLike || method === "debit";

      return {
        method,
        amount: Number(Number(p.amount || 0).toFixed(2)),
        fee_percent: isCreditLike ? Number(Number(p.fee_percent ?? 0).toFixed(2)) : 0,
        card_brand: isCard ? (String(p.card_brand ?? "").trim() || null) : null,
        installments: method === "credit" ? (p.installments ?? 1) : null,
        meta: null,
        notes: p.notes ?? null,
      };
    });

    didConfirmRef.current = true;
    onConfirm(payments);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("max-h-[90vh]", isMobile ? "max-w-[95vw]" : "max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>
            {isZeroBase ? "Total final zerado. Você pode finalizar sem registrar pagamento no caixa." : resolvedDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 p-4 bg-muted rounded-lg border border-border">
          <div className="flex justify-between text-sm">
            <span>Total a pagar (base):</span>
            <span>R$ {baseTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Total antes do desconto:</span>
            <span>R$ {grossAmountSafe.toFixed(2)}</span>
          </div>

          {(discountTotal > 0 || safeDiscountLines.length > 0) && (
            <>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Descontos:</span>
                <span>- R$ {discountTotal.toFixed(2)}</span>
              </div>

              {!!safeDiscountLines.length && (
                <div className="mt-1 space-y-1">
                  {safeDiscountLines.map((d, i) => (
                    <div key={`${d.label}-${i}`} className="flex justify-between text-xs text-muted-foreground">
                      <span>{d.label}</span>
                      <span>- R$ {Number(d.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {feeTotal > 0 && !isZeroBase && (
            <>
              <div className="flex justify-between text-sm text-primary">
                <span>Acréscimo (taxas da máquina):</span>
                <span>+ R$ {feeTotal.toFixed(2)}</span>
              </div>

              {!!feeLines.length && (
                <div className="mt-1 space-y-1">
                  {feeLines.map((f, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground">
                      <span>{f.label}</span>
                      <span>+ R$ {Number(f.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <Separator className="my-1" />

          {!isZeroBase ? (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total base pago:</span>
              <span>
                R$ {paidBaseTotal.toFixed(2)} • Restante: R$ {Math.max(0, remaining).toFixed(2)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sem pagamento necessário.</span>
              <span>Total base: R$ 0,00</span>
            </div>
          )}
        </div>

        {isZeroBase ? (
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onCancel();
              }}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => {
                didConfirmRef.current = true;
                onConfirm([]);
                onOpenChange(false);
              }}
            >
              Finalizar sem pagamento
            </Button>
          </DialogFooter>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Métodos de Pagamento</h3>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      append({
                        method: "",
                        amount: 0,
                        card_brand: null,
                        installments: 1,
                        fee_percent: 0,
                        notes: null,
                      });

                      setPaymentAmountDisplay((prev) => ({ ...prev, [fields.length]: "" }));
                      setPaymentFeeDisplay((prev) => ({ ...prev, [fields.length]: "" }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar pagamento
                  </Button>
                </div>

                {fields.map((f, idx) => {
                  const method = String(form.watch(`payments.${idx}.method`) || "").trim();
                  const amountValue = form.watch(`payments.${idx}.amount`) || 0;

                  const isCredit = method === "credit";
                  const isCreditLike = method === "credit" || method === "credit_link";
                  const isCard = isCreditLike || method === "debit";

                  return (
                    <div key={f.id} className="rounded-lg border p-3 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name={`payments.${idx}.method`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Método</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="cash">Dinheiro</SelectItem>
                                  <SelectItem value="pix">PIX</SelectItem>
                                  <SelectItem value="debit">Débito</SelectItem>
                                  <SelectItem value="credit">Crédito</SelectItem>
                                  <SelectItem value="credit_link">Crédito (Link)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`payments.${idx}.amount`}
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>Valor (R$)</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="R$ 0,00"
                                  value={paymentAmountDisplay[idx] ?? ""}
                                  onChange={(e) => {
                                    const formatted = formatCurrencyInput(e.target.value);
                                    setPaymentAmountDisplay((prev) => ({ ...prev, [idx]: formatted }));

                                    const numeric = parseFloat(
                                      formatted.replace(/[^\d,]/g, "").replace(",", ".")
                                    );
                                    field.onChange(Number.isNaN(numeric) ? 0 : numeric);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2 items-end justify-end">
                          {/* Usar restante só faz sentido no PAID */}
                          {intent === "paid" ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => fillRemainingOnRow(idx)}
                              disabled={remaining <= 0}
                              title="Preencher com o valor restante"
                            >
                              Usar restante (R$ {Math.max(0, remaining).toFixed(2)})
                            </Button>
                          ) : (
                            <div />
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              remove(idx);

                              setPaymentAmountDisplay((prev) => {
                                const next: Record<number, string> = {};
                                Object.keys(prev)
                                  .map(Number)
                                  .filter((k) => k !== idx)
                                  .sort((a, b) => a - b)
                                  .forEach((k, newIndex) => (next[newIndex] = prev[k]));
                                return next;
                              });

                              setPaymentFeeDisplay((prev) => {
                                const next: Record<number, string> = {};
                                Object.keys(prev)
                                  .map(Number)
                                  .filter((k) => k !== idx)
                                  .sort((a, b) => a - b)
                                  .forEach((k, newIndex) => (next[newIndex] = prev[k]));
                                return next;
                              });
                            }}
                            disabled={fields.length === 1}
                            title="Remover pagamento"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {(isCard || isCreditLike) && (
                        <div className={cn("grid gap-3", isCredit ? "grid-cols-2" : "grid-cols-2")}>
                          <FormField
                            control={form.control}
                            name={`payments.${idx}.card_brand`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bandeira</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: Visa / Master..."
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {isCredit ? (
                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name={`payments.${idx}.installments`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Parcelas</FormLabel>
                                    <Select
                                      onValueChange={(v) => field.onChange(Number(v))}
                                      value={String(field.value ?? 1)}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="1x" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {[...Array(12)].map((_, i) => (
                                          <SelectItem key={i + 1} value={String(i + 1)}>
                                            {i + 1}x
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
                                name={`payments.${idx}.fee_percent`}
                                render={({ field }) => (
                                  <FormItem className="min-w-0">
                                    <FormLabel>Taxa (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        value={paymentFeeDisplay[idx] ?? ""}
                                        onChange={(e) => {
                                          const formatted = formatPercentageInput(e.target.value);
                                          setPaymentFeeDisplay((prev) => ({ ...prev, [idx]: formatted }));

                                          const numeric = parseFloat(
                                            formatted.replace(/\./g, "").replace(",", ".")
                                          );
                                          field.onChange(Number.isNaN(numeric) ? 0 : numeric);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          ) : isCreditLike ? (
                            <FormField
                              control={form.control}
                              name={`payments.${idx}.fee_percent`}
                              render={({ field }) => (
                                <FormItem className="min-w-0">
                                  <FormLabel>Taxa (%)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0,00"
                                      value={paymentFeeDisplay[idx] ?? ""}
                                      onChange={(e) => {
                                        const formatted = formatPercentageInput(e.target.value);
                                        setPaymentFeeDisplay((prev) => ({ ...prev, [idx]: formatted }));

                                        const numeric = parseFloat(
                                          formatted.replace(/\./g, "").replace(",", ".")
                                        );
                                        field.onChange(Number.isNaN(numeric) ? 0 : numeric);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : (
                            <div />
                          )}
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name={`payments.${idx}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: comprovante, detalhes..."
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Pago nesta linha (base): R$ {Number(amountValue).toFixed(2)}</span>
                        <span>
                          Total base pago: R$ {paidBaseTotal.toFixed(2)} • Restante: R$ {Math.max(0, remaining).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onCancel();
                  }}
                >
                  Cancelar
                </Button>

                <Button type="submit">
                  {intent === "partial" ? "Confirmar Pagamento Parcial" : "Confirmar Pagamento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
