const MODELO = 'claude-haiku-4-5-20251001';
const CATEGORIAS = ['seguro', 'visto', 'documentos', 'passagens', 'hospedagem', 'comida', 'transporte', 'lazer', 'compras', 'compras_particular', 'outros'];
export async function POST(request) {
  try {
    const { imageBase64, mediaType } = await request.json();
    if (!imageBase64) return Response.json({ ok: false, erro: 'Sem imagem' }, { status: 400 });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ ok: false, erro: 'Chave de IA não configurada no servidor' }, { status: 500 });
    const prompt = `Você lê recibos e notas de compra. Extraia os dados e responda SOMENTE com um JSON válido, sem nenhum texto fora do JSON, neste formato:
{"valor": number, "moeda": "USD" ou "BRL", "data": "AAAA-MM-DD" ou null, "estabelecimento": string, "categoria": uma de [${CATEGORIAS.join(', ')}]}
Regras: "valor" é o TOTAL pago. Se a moeda não estiver clara, use "USD". Escolha a categoria mais provável pelo tipo do estabelecimento.`;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODELO, max_tokens: 400, messages: [{ role: 'user', content: [ { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } }, { type: 'text', text: prompt } ] }] }),
    });
    if (!resp.ok) { const t = await resp.text(); return Response.json({ ok: false, erro: 'Falha na IA: ' + t.slice(0, 200) }, { status: 502 }); }
    const json = await resp.json();
    const texto = (json.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    const limpo = texto.replace(/```json/gi, '').replace(/```/g, '').trim();
    let dados;
    try { dados = JSON.parse(limpo); } catch (e) { return Response.json({ ok: false, erro: 'Não entendi o recibo' }); }
    return Response.json({ ok: true, dados });
  } catch (e) { return Response.json({ ok: false, erro: String(e) }, { status: 500 }); }
}
