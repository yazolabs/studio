import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useSidebar } from '@/components/ui/sidebar';
import logo from '@/assets/logo.jpeg';

export function Navbar() {
  const { user } = useAuthUser();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img 
            src={logo} 
            alt="Studio Unhas Delicadas" 
            className="h-12 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
