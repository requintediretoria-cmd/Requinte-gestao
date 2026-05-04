import { isCMV } from "./categorias";

export interface LinhaDesp {
  categoria: string;
  valor:     number;
  itens:     { fornecedor: string; descricao: string; valor: number; data: Date }[];
}

export interface DREResult {
  receitaBruta:          number;
  deducoesSimplesEst:    number; // estimated DAS sobre receita
  receitaLiquida:        number;
  cmv:                   number;
  cmvLinhas:             LinhaDesp[];
  lucroBruto:            number;
  margemBruta:           number;
  despesasOp:            number;
  despesasOpLinhas:      LinhaDesp[];
  resultadoOperacional:  number;
  margemOperacional:     number;
}

interface NotaIn {
  valorTotal:     number;
  categoria:      string;
  emitenteNome:   string;
  numero:         string;
  dataEmissao:    Date;
  boletos:        { dataPagamento: Date | null; valor: number }[];
}

interface CompraIn {
  valor:      number;
  categoria:  string;
  fornecedor: string;
  descricao:  string;
  dataCompra: Date;
}

interface ReceitaIn {
  valor: number;
  data:  Date;
}

// Simples Nacional Anexo I — tabela vigente (faixas anuais)
// Usando alíquota efetiva estimada com base na faixa de receita
function aliquotaSimples(receitaBrutaMes: number): number {
  const rbAnual = receitaBrutaMes * 12;
  if (rbAnual <= 180_000)   return 0.040;
  if (rbAnual <= 360_000)   return 0.073;
  if (rbAnual <= 720_000)   return 0.095;
  if (rbAnual <= 1_800_000) return 0.107;
  if (rbAnual <= 3_600_000) return 0.143;
  return 0.190;
}

function groupByCategoria(
  items: { categoria: string; valor: number; fornecedor: string; descricao: string; data: Date }[]
): LinhaDesp[] {
  const map: Record<string, LinhaDesp> = {};
  for (const item of items) {
    if (!map[item.categoria]) {
      map[item.categoria] = { categoria: item.categoria, valor: 0, itens: [] };
    }
    map[item.categoria].valor += item.valor;
    map[item.categoria].itens.push({ fornecedor: item.fornecedor, descricao: item.descricao, valor: item.valor, data: item.data });
  }
  return Object.values(map).sort((a, b) => b.valor - a.valor);
}

export function calcularDRE(
  receitas:  ReceitaIn[],
  notas:     NotaIn[],
  compras:   CompraIn[],
  regime:    "competencia" | "caixa",
  aliquotaOverride?: number
): DREResult {
  const receitaBruta = receitas.reduce((s, r) => s + r.valor, 0);

  const aliq = aliquotaOverride ?? aliquotaSimples(receitaBruta);
  const deducoesSimplesEst = receitaBruta * aliq;
  const receitaLiquida     = receitaBruta - deducoesSimplesEst;

  // Build expense items from notas
  const despItems: { categoria: string; valor: number; fornecedor: string; descricao: string; data: Date }[] = [];

  for (const nota of notas) {
    let incluir = false;
    let dataRef  = nota.dataEmissao;

    if (regime === "competencia") {
      incluir = true;
      dataRef  = nota.dataEmissao;
    } else {
      // caixa: only include if there's a paid boleto in the period, or no boleto (paid on delivery)
      if (nota.boletos.length === 0) {
        // no boleto = paid at delivery = include by dataEmissao
        incluir = true;
        dataRef  = nota.dataEmissao;
      } else {
        const boletoPago = nota.boletos.find((b) => b.dataPagamento !== null);
        if (boletoPago?.dataPagamento) {
          incluir = true;
          dataRef  = boletoPago.dataPagamento;
        }
      }
    }

    if (incluir) {
      despItems.push({
        categoria:  nota.categoria,
        valor:      nota.valorTotal,
        fornecedor: nota.emitenteNome,
        descricao:  `NF ${nota.numero}`,
        data:       dataRef,
      });
    }
  }

  // Compras manuais (always paid cash = always included in both regimes)
  for (const c of compras) {
    despItems.push({
      categoria:  c.categoria,
      valor:      c.valor,
      fornecedor: c.fornecedor,
      descricao:  c.descricao,
      data:       c.dataCompra,
    });
  }

  const cmvItems  = despItems.filter((d) => isCMV(d.categoria));
  const opItems   = despItems.filter((d) => !isCMV(d.categoria));

  const cmvLinhas = groupByCategoria(cmvItems);
  const opLinhas  = groupByCategoria(opItems);

  const cmv         = cmvItems.reduce((s, d) => s + d.valor, 0);
  const despesasOp  = opItems.reduce((s, d) => s + d.valor, 0);
  const lucroBruto  = receitaLiquida - cmv;
  const resultOp    = lucroBruto - despesasOp;

  return {
    receitaBruta,
    deducoesSimplesEst,
    receitaLiquida,
    cmv,
    cmvLinhas,
    lucroBruto,
    margemBruta:          receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0,
    despesasOp,
    despesasOpLinhas:     opLinhas,
    resultadoOperacional: resultOp,
    margemOperacional:    receitaBruta > 0 ? (resultOp / receitaBruta) * 100 : 0,
  };
}
