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

export function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (!digits) return '';

  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 5) {
    return digits.replace(/^(\d{2})(\d{0,3})$/, '$1.$2');
  } else if (digits.length <= 8) {
    return digits.replace(/^(\d{2})(\d{3})(\d{0,3})$/, '$1.$2.$3');
  } else if (digits.length <= 12) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, '$1.$2.$3/$4');
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*/,
    '$1.$2.$3/$4-$5'
  );
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 15);

  if (!digits) return 'R$ 0,00';

  const integerPart = digits.slice(0, -2) || '0';
  const decimalPart = digits.slice(-2).padStart(2, '0');
  const formattedNumber = `${integerPart},${decimalPart}`;

  const numberValue = Number(`${integerPart}.${decimalPart}`);

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercentageInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 5);
  if (!digits) return '0';

  const numberValue = parseFloat((parseInt(digits, 10) / 100).toFixed(2));

  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function displayCurrency(value: string | number | null): string {
  if (value == null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function displayPercentage(value: string | number | null): string {
  if (value == null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function unmaskDigits(value: string) {
  return value.replace(/\D/g, "");
}
