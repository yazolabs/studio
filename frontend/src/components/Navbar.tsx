import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSidebar } from "@/components/ui/sidebar";
import logo from "@/assets/logo.jpeg";

export function Navbar() {
  const { user } = useAuthUser();
  const primaryRoleLabel = user?.roles?.[0]?.name ?? (user?.role ?? "");
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-accent shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <img
            src={logo}
            alt="Studio Unhas Delicadas"
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm text-right min-w-0">
            <p className="font-medium truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px]">
              {user?.name ?? ""}
            </p>
            <p className="text-xs text-muted-foreground capitalize truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px]">
              {primaryRoleLabel || "Sem perfil"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
