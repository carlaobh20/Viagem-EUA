import { valorEmBRL } from './format';
export function calcularSaldos(gastos, divisoes, perfis, cambio, acertos = []) {
  const saldo = {};
  perfis.forEach((p) => { saldo[p.id] = 0; });
  gastos.forEach((g) => {
    const emBRL = valorEmBRL(g, cambio);
    if (saldo[g.pago_por] !== undefined) saldo[g.pago_por] += emBRL;
    const partes = divisoes.filter((d) => d.gasto_id === g.id);
    const totalPartes = partes.reduce((s, d) => s + (Number(d.partes) || 0), 0);
    if (totalPartes > 0) partes.forEach((d) => { const cota = (emBRL * Number(d.partes)) / totalPartes; if (saldo[d.perfil_id] !== undefined) saldo[d.perfil_id] -= cota; });
  });
  acertos.forEach((a) => { if (saldo[a.de] !== undefined) saldo[a.de] += Number(a.valor); if (saldo[a.para] !== undefined) saldo[a.para] -= Number(a.valor); });
  return saldo;
}
export function quemDeveParaQuem(saldo) {
  const credores = [], devedores = [];
  Object.entries(saldo).forEach(([id, v]) => { const val = Math.round(v * 100) / 100; if (val > 0.01) credores.push({ id, v: val }); else if (val < -0.01) devedores.push({ id, v: -val }); });
  credores.sort((a, b) => b.v - a.v); devedores.sort((a, b) => b.v - a.v);
  const t = []; let i = 0, j = 0;
  while (i < devedores.length && j < credores.length) {
    const valor = Math.min(devedores[i].v, credores[j].v);
    t.push({ de: devedores[i].id, para: credores[j].id, valor: Math.round(valor * 100) / 100 });
    devedores[i].v -= valor; credores[j].v -= valor;
    if (devedores[i].v < 0.01) i += 1; if (credores[j].v < 0.01) j += 1;
  }
  return t;
}
