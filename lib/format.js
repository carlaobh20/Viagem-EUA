export function valorEmBRL(gasto, cambio) {
  if (gasto.moeda === 'BRL') return Number(gasto.valor) || 0;
  return (Number(gasto.valor) || 0) * (Number(cambio) || 0);
}
export function fmtBRL(valor) { return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
export function fmtUSD(valor) { return (Number(valor) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
export const CATEGORIAS = [
  { id: 'seguro', nome: 'Seguro viagem', emoji: '🛡️' },
  { id: 'visto', nome: 'Visto', emoji: '🛂' },
  { id: 'documentos', nome: 'Documentos / passaporte', emoji: '📄' },
  { id: 'passagens', nome: 'Passagens aéreas', emoji: '✈️' },
  { id: 'hospedagem', nome: 'Hospedagem', emoji: '🏨' },
  { id: 'comida', nome: 'Comida', emoji: '🍽️' },
  { id: 'transporte', nome: 'Gasolina / transporte', emoji: '⛽' },
  { id: 'lazer', nome: 'Lazer', emoji: '🎟️' },
  { id: 'compras', nome: 'Compras', emoji: '🛍️' },
  { id: 'compras_particular', nome: 'Compras particular', emoji: '👜' },
  { id: 'outros', nome: 'Outros', emoji: '📌' },
];
export function nomeCategoria(id) { const c = CATEGORIAS.find((x) => x.id === id); return c ? c.nome : 'Outros'; }
export function emojiCategoria(id) { const c = CATEGORIAS.find((x) => x.id === id); return c ? c.emoji : '📌'; }
