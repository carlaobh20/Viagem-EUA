// Data de HOJE (ou de um Date qualquer) no fuso do aparelho, formato "AAAA-MM-DD".
// Importante usar isso em vez de `new Date().toISOString().slice(0,10)`: o
// toISOString() converte pra UTC antes de cortar a data, então em fusos
// negativos (Brasil, UTC-3) a partir de ~21h a data "de hoje" pula pra
// amanhã por engano — gasto lançado à noite ia parar num dia errado.
export function dataLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function hojeLocal() { return dataLocal(new Date()); }

// Viagem nacional não usa dólar — só Real. Viagem sem perfil definido ainda
// (tipo_viagem ausente, todas as existentes até essa personalização existir)
// continua usando dólar normalmente, igual sempre foi.
export function usaDolar(viagem) { return viagem?.tipo_viagem !== 'nacional'; }

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
  { id: 'transporte', nome: 'Transporte / Uber', emoji: '🚕' },
  { id: 'lazer', nome: 'Lazer', emoji: '🎟️' },
  { id: 'compras', nome: 'Compras', emoji: '🛍️' },
  { id: 'compras_particular', nome: 'Compras particular', emoji: '👜' },
  { id: 'combustivel', nome: 'Combustível', emoji: '⛽' },
  { id: 'camping', nome: 'Camping / RV Park', emoji: '🏕️' },
  { id: 'supermercado', nome: 'Supermercado', emoji: '🛒' },
  { id: 'pedagio', nome: 'Pedágio', emoji: '🛣️' },
  { id: 'propano', nome: 'Propano / despejo', emoji: '💧' },
  { id: 'manutencao_rv', nome: 'Manutenção RV', emoji: '🔧' },
  { id: 'aluguel_rv', nome: 'Aluguel do RV', emoji: '🚐' },
  { id: 'outros', nome: 'Outros', emoji: '📌' },
];
// Categorias que contam no painel Motorhome (lente sobre os gastos que já existem)
export const CATEGORIAS_MOTORHOME = ['combustivel', 'camping', 'pedagio', 'propano', 'manutencao_rv', 'aluguel_rv'];
export function ehMotorhome(catId) { return CATEGORIAS_MOTORHOME.includes(catId); }
export function nomeCategoria(id) { const c = CATEGORIAS.find((x) => x.id === id); return c ? c.nome : 'Outros'; }
export function emojiCategoria(id) { const c = CATEGORIAS.find((x) => x.id === id); return c ? c.emoji : '📌'; }
