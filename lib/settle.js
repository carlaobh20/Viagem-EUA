import { paraBRL } from './format';

// Calcula o saldo de cada pessoa em reais.
// saldo > 0  => tem a receber (pagou mais do que consumiu)
// saldo < 0  => deve (consumiu mais do que pagou)
export function calcularSaldos(gastos, divisoes, perfis, cotacao) {
  const saldo = {};
  perfis.forEach((p) => {
    saldo[p.id] = 0;
  });

  gastos.forEach((g) => {
    const emBRL = paraBRL(g.valor, g.moeda, cotacao);

    // Quem pagou recebe o crédito do valor total
    if (saldo[g.pago_por] !== undefined) {
      saldo[g.pago_por] += emBRL;
    }

    // Divide o valor entre os participantes, respeitando as "partes" de cada um
    const partes = divisoes.filter((d) => d.gasto_id === g.id);
    const totalPartes = partes.reduce((s, d) => s + (Number(d.partes) || 0), 0);
    if (totalPartes > 0) {
      partes.forEach((d) => {
        const cota = (emBRL * Number(d.partes)) / totalPartes;
        if (saldo[d.perfil_id] !== undefined) {
          saldo[d.perfil_id] -= cota;
        }
      });
    }
  });

  return saldo;
}

// A partir dos saldos, descobre o menor conjunto de transferências
// para todo mundo ficar quite. Retorna [{ de, para, valor }]
export function quemDeveParaQuem(saldo) {
  const credores = [];
  const devedores = [];

  Object.entries(saldo).forEach(([id, v]) => {
    const val = Math.round(v * 100) / 100;
    if (val > 0.01) credores.push({ id, v: val });
    else if (val < -0.01) devedores.push({ id, v: -val });
  });

  credores.sort((a, b) => b.v - a.v);
  devedores.sort((a, b) => b.v - a.v);

  const transferencias = [];
  let i = 0;
  let j = 0;

  while (i < devedores.length && j < credores.length) {
    const valor = Math.min(devedores[i].v, credores[j].v);
    transferencias.push({
      de: devedores[i].id,
      para: credores[j].id,
      valor: Math.round(valor * 100) / 100,
    });
    devedores[i].v -= valor;
    credores[j].v -= valor;
    if (devedores[i].v < 0.01) i += 1;
    if (credores[j].v < 0.01) j += 1;
  }

  return transferencias;
}
