export const PLANOS = {
  individual: {
    id: 'individual',
    nome: 'Individual',
    preco: 'R$ 69,90',
    maxAcessos: 1,
  },
  familia: {
    id: 'familia',
    nome: 'Família',
    preco: 'R$ 99,90',
    maxAcessos: 5,
  },
};

export function normalizarPlano(plano) {
  return plano === 'individual' ? PLANOS.individual : PLANOS.familia;
}

export function podeConvidar({ plano, totalAcessos = 1 }) {
  const config = normalizarPlano(plano);
  return Number(totalAcessos) < config.maxAcessos;
}

export function resumoAcessos({ plano, totalAcessos = 1 }) {
  const config = normalizarPlano(plano);
  return `${Number(totalAcessos) || 0} de ${config.maxAcessos} ${config.maxAcessos === 1 ? 'acesso usado' : 'acessos usados'}`;
}
