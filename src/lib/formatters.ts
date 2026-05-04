export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatDatetime(date: string | Date) {
  return new Date(date).toLocaleString("pt-BR");
}

export function daysUntil(date: string | Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
