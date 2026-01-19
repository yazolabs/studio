import { useState } from "react";
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
}: ComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (val: ID) => {
    if (disabled) return;

    const option = options.find((opt) => String(opt.value) === String(val));
    if (option?.disabled) return;

    onChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
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
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        inPortal={false}
        align="start"
        className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-8 text-xs" />

          <CommandList className="max-h-60 overflow-y-auto">
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
