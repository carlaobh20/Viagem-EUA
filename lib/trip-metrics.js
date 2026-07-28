/**
 * Métricas derivadas da viagem — cálculos puros, sem UI.
 * Tudo aqui parte só de dados que já existem no banco hoje (gastos, viagem,
 * roteiro). Nada de geolocalização, clima ou API externa — isso é o
 * contrato: se um dia entrar dado real de outra fonte, essas funções são o
 * lugar certo pra estender, não pra reescrever.
 */
import { valorEmBRL } from './format';

/** Diferença em dias inteiros entre duas datas "AAAA-MM-DD". */
export function diffDias(a, b) {
  return Math.floor((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

/**
 * @typedef {Object} StatusViagem
 * @property {'antes'|'em_andamento'|'concluida'|'sem_data'} fase
 * @property {string} topo - rótulo curto (ex: "Faltam", "Dia", "Viagem")
 * @property {string} grande - valor grande (ex: "12", "✓")
 * @property {string} baixo - legenda (ex: "dias p/ viagem")
 * @property {number|null} diaAtual - 1-indexado, null se não aplicável
 * @property {number|null} totalDias
 */
/** @returns {StatusViagem} */
export function statusViagem(ini, fim, hoje) {
  const totalDias = (ini && fim) ? diffDias(ini, fim) + 1 : null;
  if (!ini) return { fase: 'sem_data', topo: 'Viagem', grande: '—', baixo: 'defina as datas', diaAtual: null, totalDias };
  if (hoje < ini) return { fase: 'antes', topo: 'Faltam', grande: String(diffDias(hoje, ini)), baixo: 'dias para embarcar', diaAtual: null, totalDias };
  if (fim && hoje > fim) return { fase: 'concluida', topo: 'Viagem', grande: '✓', baixo: 'concluída', diaAtual: totalDias, totalDias };
  const diaAtual = diffDias(ini, hoje) + 1;
  return { fase: 'em_andamento', topo: 'Dia', grande: String(diaAtual), baixo: totalDias ? `de ${totalDias}` : 'em viagem', diaAtual, totalDias };
}

/**
 * Ritmo diário de gasto e projeção pro fim da viagem, baseados no consumo
 * médio até agora. Só faz sentido com a viagem em andamento e datas
 * definidas — fora disso retorna null nos campos de projeção.
 * @returns {{ totalBRL: number, gastoHoje: number, gastoOntem: number, ritmoDiario: number|null, projecaoFinal: number|null, economiaProjetada: number|null }}
 */
export function pulsoFinanceiro(gastos, cambio, status, orcamento, hoje) {
  const totalBRL = gastos.reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const ontem = new Date(new Date(hoje + 'T00:00:00').getTime() - 86400000).toISOString().slice(0, 10);
  const gastoHoje = gastos.filter((g) => g.data === hoje).reduce((s, g) => s + valorEmBRL(g, cambio), 0);
  const gastoOntem = gastos.filter((g) => g.data === ontem).reduce((s, g) => s + valorEmBRL(g, cambio), 0);

  let ritmoDiario = null, projecaoFinal = null, economiaProjetada = null;
  if (status.fase === 'em_andamento' && status.diaAtual > 0) {
    ritmoDiario = totalBRL / status.diaAtual;
    if (status.totalDias) {
      projecaoFinal = ritmoDiario * status.totalDias;
      if (orcamento > 0) economiaProjetada = orcamento - projecaoFinal;
    }
  }
  return { totalBRL, gastoHoje, gastoOntem, ritmoDiario, projecaoFinal, economiaProjetada };
}

/** Pontos do roteiro ordenados por data + hora (só os que têm data). */
export function ordenarRoteiro(pontos) {
  return (pontos || [])
    .filter((p) => p.data_inicio)
    .sort((a, b) => (a.data_inicio === b.data_inicio ? (a.hora || '').localeCompare(b.hora || '') : a.data_inicio.localeCompare(b.data_inicio)));
}

/**
 * Janela de timeline centrada no "agora": até 1 ponto passado + o próximo +
 * até 2 futuros. Também devolve o local mais recente já visitado, usado
 * como proxy de "onde a pessoa está" sem depender de GPS.
 */
export function janelaTimeline(ordPontos, hoje) {
  const prox = ordPontos.find((p) => p.data_inicio >= hoje) || ordPontos[ordPontos.length - 1] || null;
  const idx = prox ? ordPontos.indexOf(prox) : -1;
  const janela = idx >= 0 ? ordPontos.slice(Math.max(0, idx - 1), idx + 3) : ordPontos.slice(0, 4);
  const passados = ordPontos.filter((p) => p.data_inicio <= hoje);
  const localAtual = passados.length ? passados[passados.length - 1] : null;
  return { prox, janela, localAtual };
}
