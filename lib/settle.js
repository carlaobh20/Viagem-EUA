import { valorEmBRL } from './format';

function arredondarCentavos(valor) {
  const n = Number(valor) || 0;
  return Math.round((n + Math.sign(n) * 1e-9) * 100) / 100;
}

export function detalharGasto(gasto, divisoes) {
  const partes = divisoes.filter((d) => d.gasto_id === gasto.id);
  const totalPartes = partes.reduce((s, d) => s + (Number(d.partes) || 0), 0);
  const valor = Number(gasto.valor) || 0;
  const cotas = totalPartes > 0
    ? partes.map((d) => ({ perfilId: d.perfil_id, valor: (valor * (Number(d.partes) || 0)) / totalPartes }))
    : [];
  return { pagoPor: gasto.pago_por || null, cadaUmPagou: !gasto.pago_por, cotas };
}

export function calcularSaldos(gastos, divisoes, perfis, cambio, acertos = []) {
  const saldo = {};
  perfis.forEach((p) => { saldo[p.id] = 0; });
  gastos.forEach((g) => {
    // Neste modo cada participante já pagou exatamente a própria parte. A compra
    // conta no consumo, mas não cria crédito nem dívida no acerto de contas.
    if (!g.pago_por) return;
    const emBRL = valorEmBRL(g, cambio);
    const partes = divisoes.filter((d) => d.gasto_id === g.id);
    const totalPartes = partes.reduce((s, d) => s + (Number(d.partes) || 0), 0);
    if (totalPartes <= 0) return;

    // Quem pagou adianta o valor total; cada participante assume somente sua cota.
    // Os movimentos entram no mesmo saldo para compensar créditos e dívidas
    // opostos. user_id registra quem lançou e não interfere no cálculo financeiro.
    if (saldo[g.pago_por] !== undefined) saldo[g.pago_por] += emBRL;
    partes.forEach((d) => {
      const cota = (emBRL * Number(d.partes)) / totalPartes;
      if (saldo[d.perfil_id] !== undefined) saldo[d.perfil_id] -= cota;
    });
  });
  acertos.forEach((a) => {
    const vBRL = a.moeda === 'USD' ? Number(a.valor) * Number(cambio) : Number(a.valor);
    if (saldo[a.de] !== undefined) saldo[a.de] += vBRL;
    if (saldo[a.para] !== undefined) saldo[a.para] -= vBRL;
  });
  return saldo;
}

export function calcularConsumo(gastos, divisoes, perfis, cambio) {
  const consumo = {};
  perfis.forEach((p) => { consumo[p.id] = 0; });
  gastos.forEach((g) => {
    const emBRL = valorEmBRL(g, cambio);
    const partes = divisoes.filter((d) => d.gasto_id === g.id);
    const totalPartes = partes.reduce((s, d) => s + (Number(d.partes) || 0), 0);
    if (totalPartes > 0) partes.forEach((d) => { if (consumo[d.perfil_id] !== undefined) consumo[d.perfil_id] += (emBRL * Number(d.partes)) / totalPartes; });
  });
  return consumo;
}

// Quanto cada pessoa consumiu, SEPARADO por moeda (sem converter).
export function calcularConsumoPorMoeda(gastos, divisoes, perfis) {
  const r = {};
  perfis.forEach((p) => { r[p.id] = { usd: 0, brl: 0 }; });
  gastos.forEach((g) => {
    const partes = divisoes.filter((d) => d.gasto_id === g.id);
    const totalPartes = partes.reduce((s, d) => s + (Number(d.partes) || 0), 0);
    if (totalPartes <= 0) return;
    const v = Number(g.valor) || 0;
    partes.forEach((d) => {
      if (!r[d.perfil_id]) return;
      const cota = (v * Number(d.partes)) / totalPartes;
      if (g.moeda === 'USD') r[d.perfil_id].usd += cota; else r[d.perfil_id].brl += cota;
    });
  });
  return r;
}

export function quemDeveParaQuem(saldo) {
  const credores = [], devedores = [];
  Object.entries(saldo).forEach(([id, v]) => { const val = arredondarCentavos(v); if (val > 0.01) credores.push({ id, v: val }); else if (val < -0.01) devedores.push({ id, v: -val }); });
  credores.sort((a, b) => b.v - a.v); devedores.sort((a, b) => b.v - a.v);
  const t = []; let i = 0, j = 0;
  while (i < devedores.length && j < credores.length) {
    const valor = Math.min(devedores[i].v, credores[j].v);
    t.push({ de: devedores[i].id, para: credores[j].id, valor: arredondarCentavos(valor) });
    devedores[i].v -= valor; credores[j].v -= valor;
    if (devedores[i].v < 0.01) i += 1; if (credores[j].v < 0.01) j += 1;
  }
  return t;
}
