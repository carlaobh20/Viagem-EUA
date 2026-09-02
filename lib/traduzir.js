// Tradução de texto — usa o MyMemory (gratuito, sem chave, ~5.000 caracteres por
// dia por conexão). Bom pra frases curtas de viagem; não é pra traduzir um livro.
// Resultado fica guardado no aparelho (localStorage) pra não gastar a cota de novo
// com a mesma frase.

export const IDIOMAS = [
  { code: 'pt-BR', nome: 'Português', bandeira: '🇧🇷', voz: 'pt-BR', ocr: 'por' },
  { code: 'en-US', nome: 'Inglês', bandeira: '🇺🇸', voz: 'en-US', ocr: 'eng' },
  { code: 'es-ES', nome: 'Espanhol', bandeira: '🇪🇸', voz: 'es-ES', ocr: 'spa' },
  { code: 'fr-FR', nome: 'Francês', bandeira: '🇫🇷', voz: 'fr-FR', ocr: 'fra' },
  { code: 'it-IT', nome: 'Italiano', bandeira: '🇮🇹', voz: 'it-IT', ocr: 'ita' },
  { code: 'de-DE', nome: 'Alemão', bandeira: '🇩🇪', voz: 'de-DE', ocr: 'deu' },
  { code: 'ja-JP', nome: 'Japonês', bandeira: '🇯🇵', voz: 'ja-JP', ocr: 'jpn' },
];
export const idioma = (code) => IDIOMAS.find((i) => i.code === code) || IDIOMAS[1];

const chave = (txt, de, para) => `trad:${de}>${para}:${txt}`;

function lerCache(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function gravarCache(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* cheio ou bloqueado */ } }

/**
 * @returns {Promise<string>} texto traduzido
 * @throws {Error} com mensagem já em português pra mostrar na tela
 */
export async function traduzir(texto, de, para) {
  const t = (texto || '').trim();
  if (!t) return '';
  if (de === para) return t;
  const k = chave(t, de, para);
  const hit = lerCache(k);
  if (hit) return hit;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${encodeURIComponent(de)}|${encodeURIComponent(para)}`;
  let r;
  try { r = await fetch(url); } catch (e) { throw new Error('Sem internet pra traduzir agora.'); }
  if (r.status === 429) throw new Error('O tradutor gratuito atingiu o limite de hoje. Tenta de novo amanhã (ou usa o Google Tradutor pra este texto).');
  const j = await r.json().catch(() => null);
  if (!j || !j.responseData) throw new Error('O tradutor não respondeu direito. Tenta de novo.');
  if (j.quotaFinished) throw new Error('O tradutor gratuito atingiu o limite de hoje. Tenta de novo amanhã.');
  if (j.responseStatus && j.responseStatus !== 200) throw new Error(String(j.responseDetails || 'Erro no tradutor.'));
  const out = (j.responseData.translatedText || '').trim();
  // o MyMemory às vezes devolve o próprio erro dentro do texto traduzido
  if (/^(QUERY LENGTH LIMIT|MYMEMORY WARNING|PLEASE SELECT TWO DISTINCT)/i.test(out)) throw new Error('Texto grande demais pro tradutor gratuito (máx. ~500 caracteres por vez).');
  if (out) gravarCache(k, out);
  return out;
}
