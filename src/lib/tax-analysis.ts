export interface TaxAnalysis {
  simples: SimplesAnalysis;
  lp: LPAnalysis;
}

export interface SimplesAnalysis {
  icmsST: number;
  icmsProprio: number;
  difal: number;
  totalAproveitavel: number;
  detalhes: TaxDetail[];
}

export interface LPAnalysis {
  icmsCredito: number;
  pisCofinsNaoCredita: string;
  totalEstimado: number;
  detalhes: TaxDetail[];
}

export interface TaxDetail {
  tipo: string;
  valor: number;
  descricao: string;
  aproveitavel: boolean;
  fundamentacao: string;
}

export function analyzeTaxes(nf: {
  valorICMS: number;
  valorICMSST: number;
  valorDIFAL: number;
  valorPIS: number;
  valorCOFINS: number;
  valorTotal: number;
  emitenteUF: string;
}): TaxAnalysis {
  const simplesDetalhes: TaxDetail[] = [];
  const lpDetalhes: TaxDetail[] = [];

  // === SIMPLES NACIONAL ===

  // ICMS-ST: pago antecipadamente pelo substituto. Pode ser recuperado
  // se o produto for usado como insumo (não revendido) ou em caso de perda.
  if (nf.valorICMSST > 0) {
    simplesDetalhes.push({
      tipo: "ICMS_ST",
      valor: nf.valorICMSST,
      descricao: "ICMS-ST pago na entrada",
      aproveitavel: true,
      fundamentacao: "Art. 23 LC 123/2006 — restituição quando o fato gerador não se realiza (insumo/perda). Solicitar ao Fisco estadual.",
    });
  }

  // ICMS Próprio: no Simples Nacional o ICMS é recolhido via DAS.
  // Alguns estados permitem abater o ICMS destacado na NF de entrada
  // da parcela ICMS do DAS (depende do estado).
  if (nf.valorICMS > 0) {
    simplesDetalhes.push({
      tipo: "ICMS_PROPRIO",
      valor: nf.valorICMS,
      descricao: "ICMS próprio destacado na NF",
      aproveitavel: true,
      fundamentacao: "Resolução CGSN 140/2018, art. 115 — verifique legislação do seu estado para aproveitamento na parcela ICMS do DAS.",
    });
  }

  // DIFAL: diferencial de alíquota em compras interestaduais.
  // Simples Nacional pode ter DIFAL cobrado; verificar se foi correto.
  if (nf.valorDIFAL > 0) {
    simplesDetalhes.push({
      tipo: "DIFAL",
      valor: nf.valorDIFAL,
      descricao: "DIFAL cobrado em compra interestadual",
      aproveitavel: false,
      fundamentacao: "EC 87/2015 — verifique se a alíquota aplicada está correta para o Simples. Erro pode gerar restituição.",
    });
  }

  // PIS/COFINS no Simples não gera crédito (recolhido via DAS)
  if (nf.valorPIS + nf.valorCOFINS > 0) {
    simplesDetalhes.push({
      tipo: "PIS_COFINS",
      valor: nf.valorPIS + nf.valorCOFINS,
      descricao: "PIS/COFINS destacado na NF (sem crédito no Simples)",
      aproveitavel: false,
      fundamentacao: "No Simples Nacional o PIS/COFINS é recolhido dentro do DAS. Os valores destacados pelo fornecedor NÃO geram crédito para o destinatário.",
    });
  }

  const totalSimples = simplesDetalhes
    .filter((d) => d.aproveitavel)
    .reduce((s, d) => s + d.valor, 0);

  // === LUCRO PRESUMIDO (SIMULAÇÃO) ===

  // No LP, o ICMS gera crédito pleno sobre as entradas.
  // A alíquota média de ICMS para restaurante fica ~12% nas interestaduais e 17-18% nas internas.
  // Usamos o valor destacado na NF diretamente.
  const icmsCreditoLP = nf.valorICMS + nf.valorICMSST;

  if (icmsCreditoLP > 0) {
    lpDetalhes.push({
      tipo: "ICMS_CREDITO",
      valor: icmsCreditoLP,
      descricao: "Crédito de ICMS sobre entradas (ICMS + ST)",
      aproveitavel: true,
      fundamentacao: "No Lucro Presumido, o ICMS destacado nas entradas gera crédito a ser abatido do ICMS a recolher sobre as saídas.",
    });
  }

  // PIS/COFINS no LP é cumulativo (0,65%/3%) — sem crédito sobre entradas
  lpDetalhes.push({
    tipo: "PIS_COFINS_LP",
    valor: 0,
    descricao: "PIS/COFINS no LP é cumulativo — sem crédito sobre compras",
    aproveitavel: false,
    fundamentacao: "No Lucro Presumido o PIS (0,65%) e COFINS (3%) são cumulativos. Para crédito de PIS/COFINS seria necessário Lucro Real (não-cumulativo).",
  });

  const totalLP = lpDetalhes
    .filter((d) => d.aproveitavel)
    .reduce((s, d) => s + d.valor, 0);

  return {
    simples: {
      icmsST: nf.valorICMSST,
      icmsProprio: nf.valorICMS,
      difal: nf.valorDIFAL,
      totalAproveitavel: totalSimples,
      detalhes: simplesDetalhes,
    },
    lp: {
      icmsCredito: icmsCreditoLP,
      pisCofinsNaoCredita: "PIS/COFINS cumulativo no LP — sem crédito",
      totalEstimado: totalLP,
      detalhes: lpDetalhes,
    },
  };
}
