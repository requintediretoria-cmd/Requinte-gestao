export const CATEGORIAS = [
  "Carnes e Proteínas",
  "Hortifruti",
  "Laticínios e Frios",
  "Grãos e Cereais",
  "Bebidas",
  "Descartáveis e Embalagens",
  "Higiene e Limpeza",
  "Manutenção",
  "Equipamentos",
  "Serviços",
  "Outros",
] as const;

export type Categoria = typeof CATEGORIAS[number];

// Categorias que compõem o CMV (Custo das Mercadorias Vendidas)
export const CATEGORIAS_CMV = new Set([
  "Carnes e Proteínas",
  "Hortifruti",
  "Laticínios e Frios",
  "Grãos e Cereais",
  "Bebidas",
]);

// Demais categorias são Despesas Operacionais
export function isCMV(categoria: string): boolean {
  return CATEGORIAS_CMV.has(categoria);
}

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Cartão Débito",
  "Cartão Crédito",
  "PIX",
  "Outros",
] as const;
