import yazolabsLogo from '@/assets/yazolabs-logo.svg';

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <span>Powered by</span>
          <a 
            href="https://yazolabs.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src={yazolabsLogo} 
              alt="Yazo Labs" 
              className="h-6 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
