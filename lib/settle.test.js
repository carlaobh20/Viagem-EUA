import { describe, expect, it } from 'vitest';
import { calcularSaldos, detalharGasto, quemDeveParaQuem } from './settle';

const CARLOS = 'carlos';
const WILSON = 'wilson';
const perfis = [{ id: CARLOS }, { id: WILSON }];
const cambio = 1;

function gasto(id, pagoPor, valor) {
  return { id, pago_por: pagoPor, valor, moeda: 'USD' };
}

function dividirIgual(gastoId) {
  return [
    { gasto_id: gastoId, perfil_id: CARLOS, partes: 1 },
    { gasto_id: gastoId, perfil_id: WILSON, partes: 1 },
  ];
}

function calcular(gastos, divisoes) {
  const saldos = calcularSaldos(gastos, divisoes, perfis, cambio);
  return { saldos, transferencias: quemDeveParaQuem(saldos) };
}

describe('compensação de despesas no acerto de contas', () => {
  it('caso 1: reduz de US$ 100 para US$ 75 a dívida de Wilson', () => {
    const gastos = [gasto('divida-inicial', CARLOS, 200), gasto('compra-wilson', WILSON, 50)];
    const divisoes = [...dividirIgual('divida-inicial'), ...dividirIgual('compra-wilson')];
    const { saldos, transferencias } = calcular(gastos, divisoes);

    expect(saldos).toEqual({ [CARLOS]: 75, [WILSON]: -75 });
    expect(transferencias).toEqual([{ de: WILSON, para: CARLOS, valor: 75 }]);
  });

  it('caso 2: Carlos deve US$ 50 quando Wilson paga US$ 100', () => {
    const { transferencias } = calcular([gasto('g1', WILSON, 100)], dividirIgual('g1'));
    expect(transferencias).toEqual([{ de: CARLOS, para: WILSON, valor: 50 }]);
  });

  it('caso 3: Wilson deve US$ 50 quando Carlos paga US$ 100', () => {
    const { transferencias } = calcular([gasto('g1', CARLOS, 100)], dividirIgual('g1'));
    expect(transferencias).toEqual([{ de: WILSON, para: CARLOS, valor: 50 }]);
  });

  it('caso 4: créditos opostos de US$ 50 resultam em saldo zero', () => {
    const gastos = [gasto('pago-carlos', CARLOS, 100), gasto('pago-wilson', WILSON, 100)];
    const divisoes = [...dividirIgual('pago-carlos'), ...dividirIgual('pago-wilson')];
    const { saldos, transferencias } = calcular(gastos, divisoes);

    expect(saldos).toEqual({ [CARLOS]: 0, [WILSON]: 0 });
    expect(transferencias).toEqual([]);
  });

  it('caso 5: compensa o crédito de Wilson sem criar cobrança inversa', () => {
    const gastos = [gasto('divida-inicial', CARLOS, 200), gasto('compra-wilson', WILSON, 50)];
    const divisoes = [...dividirIgual('divida-inicial'), ...dividirIgual('compra-wilson')];
    const { transferencias } = calcular(gastos, divisoes);

    expect(transferencias).toHaveLength(1);
    expect(transferencias[0]).toEqual({ de: WILSON, para: CARLOS, valor: 75 });
    expect(transferencias).not.toContainEqual({ de: CARLOS, para: WILSON, valor: 25 });
  });

  it('cada um já pagou sua parte: registra consumo sem criar dívida', () => {
    const { saldos, transferencias } = calcular(
      [gasto('almoco', null, 100)],
      dividirIgual('almoco'),
    );

    expect(saldos).toEqual({ [CARLOS]: 0, [WILSON]: 0 });
    expect(transferencias).toEqual([]);
  });

  it('detalha o pagador e a parte individual para a auditoria', () => {
    const compra = gasto('almoco', WILSON, 100);
    expect(detalharGasto(compra, dividirIgual('almoco'))).toEqual({
      pagoPor: WILSON,
      cadaUmPagou: false,
      cotas: [
        { perfilId: CARLOS, valor: 50 },
        { perfilId: WILSON, valor: 50 },
      ],
    });
  });

  it('divide US$ 121,23 entre Carlos e Wilson e credita somente metade a Wilson', () => {
    const { saldos, transferencias } = calcular([gasto('gasolina', WILSON, 121.23)], dividirIgual('gasolina'));

    expect(saldos[CARLOS]).toBeCloseTo(-60.615, 3);
    expect(saldos[WILSON]).toBeCloseTo(60.615, 3);
    expect(transferencias).toEqual([{ de: CARLOS, para: WILSON, valor: 60.62 }]);
  });
});
