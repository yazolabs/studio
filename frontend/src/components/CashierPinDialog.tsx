import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, X, Lock } from "lucide-react";
import { cashierSetPin, cashierUnlock } from "@/services/cashierPinService";

type Mode = "unlock" | "set";

export function CashierPinDialog({
  open,
  mode,
  onSuccess,
  onOpenChange,
}: {
  open: boolean;
  mode: Mode;
  onSuccess: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pinRef = useRef<HTMLInputElement>(null);

  const isPinValid = useMemo(() => /^\d{4}$/.test(pin), [pin]);
  const isConfirmValid = useMemo(() => /^\d{4}$/.test(confirmPin), [confirmPin]);

  const canSubmit =
    mode === "unlock" ? isPinValid : isPinValid && isConfirmValid && pin === confirmPin;

  const title = mode === "unlock" ? "PIN do Caixa" : "Definir PIN do Caixa";
  const description =
    mode === "unlock"
      ? "Digite o PIN de 4 dígitos para acessar o caixa."
      : "Defina um PIN de 4 dígitos. Ele será solicitado sempre que você entrar no caixa.";

  const requestClose = () => {
    if (loading) return;
    onOpenChange?.(false);
  };

  useEffect(() => {
    if (!open) return;

    setPin("");
    setConfirmPin("");
    setErr(null);
    setShowPin(false);
    setShowConfirmPin(false);

    const t = window.setTimeout(() => pinRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading]);

  async function handleSubmit() {
    if (!canSubmit || loading) return;

    setErr(null);
    setLoading(true);

    try {
      if (mode === "set") {
        await cashierSetPin(pin);
        await cashierUnlock(pin);
      } else {
        await cashierUnlock(pin);
      }

      onSuccess();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Não foi possível validar o PIN.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onMouseDown={requestClose}
    >
      <div
        className="w-full max-w-[420px] rounded-lg border bg-background shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-6 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <h2 className="text-lg font-semibold leading-none">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mt-1 -mr-1"
            onClick={requestClose}
            aria-label="Fechar"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 pb-6">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="relative pt-2">
              <Input
                ref={pinRef}
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(v);
                }}
                inputMode="numeric"
                placeholder="Insira o PIN"
                maxLength={4}
                autoComplete="off"
                className="pr-10"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPin((s) => !s)}
                aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                disabled={loading}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {mode === "set" && (
              <div className="relative">
                <Input
                  type={showConfirmPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setConfirmPin(v);
                  }}
                  inputMode="numeric"
                  placeholder="Confirmar PIN"
                  maxLength={4}
                  autoComplete="off"
                  className="pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowConfirmPin((s) => !s)}
                  aria-label={showConfirmPin ? "Ocultar confirmação" : "Mostrar confirmação"}
                  disabled={loading}
                >
                  {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {mode === "set" && pin.length === 4 && confirmPin.length === 4 && pin !== confirmPin && (
              <p className="text-sm text-destructive">Os PINs não conferem.</p>
            )}

            {err && <p className="text-sm text-destructive">{err}</p>}

            <div className="space-y-2">
              <Button className="w-full" type="submit" disabled={!canSubmit || loading}>
                {loading ? "Processando..." : mode === "unlock" ? "Desbloquear" : "Salvar e desbloquear"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={requestClose}
                disabled={loading}
              >
                Fechar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
