import yazolabsLogo from "@/assets/yazolabs-logo.svg";

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto w-full min-h-[65px] flex items-center">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-end sm:gap-3">
          <span>Powered by</span>
          <a
            href="https://yazolabs.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img src={yazolabsLogo} alt="Yazo Labs" className="h-6 w-auto" />
          </a>
        </div>
      </div>
    </footer>
  );
}
