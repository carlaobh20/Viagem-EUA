import { describe, expect, it } from 'vitest';
import { normalizarPlano, podeConvidar, resumoAcessos } from './plans';

describe('planos comerciais', () => {
  it('limita o plano individual ao comprador', () => {
    expect(podeConvidar({ plano: 'individual', totalAcessos: 1 })).toBe(false);
  });

  it('permite até cinco acessos no plano família', () => {
    expect(podeConvidar({ plano: 'familia', totalAcessos: 4 })).toBe(true);
    expect(podeConvidar({ plano: 'familia', totalAcessos: 5 })).toBe(false);
  });

  it('mantém viagens antigas como família para não retirar acessos', () => {
    expect(normalizarPlano(null).id).toBe('familia');
    expect(resumoAcessos({ plano: null, totalAcessos: 3 })).toBe('3 de 5 acessos usados');
  });
});
