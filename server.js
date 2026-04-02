const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("ansioso")) return "ansioso";
  if (texto.includes("medo")) return "medo";
  if (texto.includes("triste")) return "triste";
  if (texto.includes("raiva")) return "raiva";
  if (texto.includes("desmotivado")) return "desmotivado";
  if (texto.includes("frustrado")) return "frustrado";

  return "neutro";
}

app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    const estadoAtual = detectarEstado(mensagem);

    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    const lista = historico || [];

    // 🧬 PERFIL
    let contagem = {};
    lista.forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;
    });

    let perfil = "Equilibrado";
    let maior = 0;

    Object.keys(contagem).forEach(e => {
      if (contagem[e] > maior) {
        maior = contagem[e];
        perfil = e;
      }
    });

    // 🔥 FASE
    let fase = "Início";
    if (lista.length > 5) fase = "Consciência";
    if (lista.length > 10) fase = "Controle";
    if (lista.length > 20) fase = "Transformação";

    // 📊 RELATÓRIO
    let negativos = ["ansioso","desmotivado","frustrado"];
    let qtdNegativos = lista.filter(i => negativos.includes(i.estado)).length;

    let tendencia = "Estável";
    if (qtdNegativos > lista.length / 2) tendencia = "Queda";
    else if (qtdNegativos < lista.length / 3) tendencia = "Melhora";

    // 🎯 META
    let meta = "Observar emoções";
    let trilha = "Autoconhecimento";

    if (estadoAtual === "ansioso") {
      meta = "Respiração por 3 dias";
      trilha = "Controle da ansiedade";
    }

    // 🧠 RESPOSTA
    let resposta = `🧠 NeuroMapa360 — Relatório Inteligente\n\n`;

    resposta += `🧬 Perfil: ${perfil}\n`;
    resposta += `📍 Fase: ${fase}\n`;
    resposta += `📊 Tendência: ${tendencia}\n\n`;

    resposta += `🎯 Meta: ${meta}\n`;
    resposta += `🚀 Trilha: ${trilha}\n`;

    res.json({
      resposta,
      perfil,
      fase,
      tendencia,
      meta,
      trilha,
      totalRegistros: lista.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
