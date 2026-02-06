import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ID = string | number;

export type ComboboxOption = {
  value: ID;
  label: string;
  disabled?: boolean;
  variant?: "default" | "success" | "danger" | "warning" | "muted";
};

interface ComboboxProps {
  value: ID | null | undefined;
  onChange: (value: ID | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  buttonClassName?: string;
  disabled?: boolean;
  autoFocusSearch?: boolean;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;

  let parent: HTMLElement | null = el.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const overflow = style.overflow;
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflow === "auto" ||
      overflow === "scroll"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  buttonClassName,
  disabled = false,
  autoFocusSearch = true,
  scrollContainerRef,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollParentRef = useRef<HTMLElement | null>(null);
  const scrollTopBeforeRef = useRef<number>(0);

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  const resolveScrollContainer = () => {
    const explicit = scrollContainerRef?.current ?? null;
    if (explicit) return explicit;

    return getScrollParent(triggerRef.current);
  };

  const captureScrollPosition = () => {
    const sp = resolveScrollContainer();
    scrollParentRef.current = sp;
    scrollTopBeforeRef.current = sp ? sp.scrollTop : 0;
  };

  const restoreScrollPosition = () => {
    const sp = scrollParentRef.current;
    if (!sp) return;
    sp.scrollTop = scrollTopBeforeRef.current;
  };

  const handleSelect = (val: ID) => {
    if (disabled) return;

    const option = options.find((opt) => String(opt.value) === String(val));
    if (option?.disabled) return;

    onChange(val);
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      restoreScrollPosition();

      requestAnimationFrame(() => {
        restoreScrollPosition();

        if (autoFocusSearch) {
          inputRef.current?.focus?.({ preventScroll: true } as any);
        }
      });
    });
  }, [open, autoFocusSearch]);

  useLayoutEffect(() => {
    if (open) return;
    restoreScrollPosition();
  }, [open]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        if (next) captureScrollPosition();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full min-w-0 justify-between h-9 text-sm",
            !selectedOption && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-70",
            buttonClassName
          )}
          onPointerDownCapture={() => {
            if (!disabled) captureScrollPosition();
          }}
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        inPortal={false}
        align="start"
        className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus?.({ preventScroll: true } as any);
          restoreScrollPosition();
        }}
      >
        <Command>
          <CommandInput
            ref={inputRef as any}
            placeholder={searchPlaceholder}
            className="h-8 text-xs"
            autoFocus={false}
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              requestAnimationFrame(() => {
                listRef.current?.scrollTo({ top: 0 });
              });
            }}
          />

          <CommandList ref={listRef as any} className="max-h-60 overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>

            <CommandGroup>
              {options.map((opt) => {
                const isSelected = value != null && String(value) === String(opt.value);
                const isDisabled = !!opt.disabled;

                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={String(opt.label)}
                    onSelect={() => {
                      if (isDisabled) return;
                      handleSelect(opt.value);
                    }}
                    aria-disabled={isDisabled}
                    className={cn(
                      "flex items-center justify-between text-sm",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      opt.variant === "success" && "bg-emerald-50 text-emerald-700",
                      opt.variant === "danger" && "bg-destructive/10 text-destructive",
                      opt.variant === "warning" && "bg-amber-50 text-amber-700",
                      opt.variant === "muted" && "bg-slate-50 text-slate-500"
                    )}
                  >
                    <span className="whitespace-normal break-words text-left">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 opacity-100" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
