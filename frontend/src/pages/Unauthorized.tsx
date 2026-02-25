import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border bg-background p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border p-3">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
            <p className="mt-2 text-muted-foreground">
              Você não tem permissão para acessar esta página.
              Se você acredita que isso é um erro, fale com o administrador.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>

            <div className="mt-6 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              Código: <span className="font-medium text-foreground">403</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}