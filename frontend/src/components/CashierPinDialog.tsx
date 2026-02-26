import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cashierSetPin, cashierUnlock } from "@/services/cashierPinService";

type Mode = "unlock" | "set";

export function CashierPinDialog({
  open,
  mode,
  onSuccess,
}: {
  open: boolean;
  mode: Mode;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isPinValid = useMemo(() => /^\d{4}$/.test(pin), [pin]);
  const isConfirmValid = useMemo(() => /^\d{4}$/.test(confirmPin), [confirmPin]);

  const canSubmit =
    mode === "unlock"
      ? isPinValid
      : isPinValid && isConfirmValid && pin === confirmPin;

  const title = mode === "unlock" ? "PIN do Caixa" : "Definir PIN do Caixa";
  const description =
    mode === "unlock"
      ? "Digite o PIN de 4 dígitos para acessar o caixa."
      : "Defina um PIN de 4 dígitos. Ele será solicitado sempre que você entrar no caixa.";

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

      setPin("");
      setConfirmPin("");
      setShowPin(false);
      setShowConfirmPin(false);
      onSuccess();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? "Não foi possível validar o PIN.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="relative pt-2">
            <Input
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
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPin((s) => !s)}
              aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
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
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowConfirmPin((s) => !s)}
                aria-label={showConfirmPin ? "Ocultar confirmação" : "Mostrar confirmação"}
              >
                {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {mode === "set" && pin.length === 4 && confirmPin.length === 4 && pin !== confirmPin && (
            <p className="text-sm text-destructive">Os PINs não conferem.</p>
          )}

          {err && <p className="text-sm text-destructive">{err}</p>}

          <Button className="w-full" type="submit" disabled={!canSubmit || loading}>
            {loading ? "Processando..." : mode === "unlock" ? "Desbloquear" : "Salvar e desbloquear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
