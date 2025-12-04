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

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );

  const handleSelect = (val: ID) => {
    if (disabled) return;
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
            "w-full justify-between h-9 text-sm",
            !selectedOption && "text-muted-foreground",
            disabled && "cursor-not-allowed opacity-70",
            buttonClassName,
          )}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent inPortal={false} className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-8 text-xs"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected =
                  value != null && String(value) === String(opt.value);

                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={String(opt.label)}
                    onSelect={() => handleSelect(opt.value)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{opt.label}</span>
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
