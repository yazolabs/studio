export function formatCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d{0,3})$/, '$1-$2');
}

export function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  let formatted = digits;

  if (digits.length > 9) {
    formatted = digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
  } else if (digits.length > 6) {
    formatted = digits.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
  } else if (digits.length > 3) {
    formatted = digits.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
  }

  return formatted;
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) return 'R$ 0,00';

  const limited = digits.slice(0, 15);

  const numberValue = parseFloat((parseInt(limited, 10) / 100).toFixed(2));

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
