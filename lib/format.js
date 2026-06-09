// Converte qualquer gasto para reais usando a cotação manual da viagem.
// cotacao = quantos reais vale 1 dólar (ex.: 5.40)
export function paraBRL(valor, moeda, cotacao) {
  const v = Number(valor) || 0;
  return moeda === 'BRL' ? v : v * (Number(cotacao) || 0);
}

// Formata número como Real: R$ 1.234,56
export function fmtBRL(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Formata número como Dólar: $ 1,234.56
export function fmtUSD(valor) {
  return (Number(valor) || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

// Mostra o valor na moeda original do gasto
export function fmtMoeda(valor, moeda) {
  return moeda === 'BRL' ? fmtBRL(valor) : fmtUSD(valor);
}

// Categorias disponíveis (rótulo + ícone usado na interface)
export const CATEGORIAS = [
  { id: 'seguro', nome: 'Seguro viagem', emoji: '🛡️' },
  { id: 'documentos', nome: 'Documentos / passaporte', emoji: '🛂' },
  { id: 'passagens', nome: 'Passagens aéreas', emoji: '✈️' },
  { id: 'hospedagem', nome: 'Hospedagem', emoji: '🏨' },
  { id: 'comida', nome: 'Comida', emoji: '🍽️' },
  { id: 'transporte', nome: 'Gasolina / transporte', emoji: '⛽' },
  { id: 'lazer', nome: 'Ingressos / lazer', emoji: '🎟️' },
  { id: 'compras', nome: 'Compras', emoji: '🛍️' },
  { id: 'outros', nome: 'Outros', emoji: '📌' },
];

export function nomeCategoria(id) {
  const c = CATEGORIAS.find((x) => x.id === id);
  return c ? c.nome : 'Outros';
}

export function emojiCategoria(id) {
  const c = CATEGORIAS.find((x) => x.id === id);
  return c ? c.emoji : '📌';
}
