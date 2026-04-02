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

// 🔍 DETECTAR ESTADO
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("ansioso") || texto.includes("ansiedade")) return "ansioso";
  if (texto.includes("medo")) return "medo";
  if (texto.includes("triste")) return "triste";
  if (texto.includes("raiva") || texto.includes("irritado")) return "raiva";
  if (texto.includes("desmotivado")) return "desmotivado";
  if (texto.includes("frustrado")) return "frustrado";

  return "neutro";
}

app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    const estadoAtual = detectarEstado(mensagem);

    // 🔍 HISTÓRICO
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email)
      .order("created_at", { ascending: false });

    const lista = historico || [];

    // 🔥 ANALISAR TENDÊNCIA
    let negativosRecentes = 0;

    lista.slice(0, 5).forEach(item => {
      if (
        item.estado === "ansioso" ||
        item.estado === "desmotivado" ||
        item.estado === "frustrado"
      ) {
        negativosRecentes++;
      }
    });

    let tendencia = "estavel";

    if (negativosRecentes >= 4) tendencia = "queda";
    else if (negativosRecentes <= 1) tendencia = "melhora";

    // 🔥 STREAK
    let streak = lista.length;

    // 🎯 META
    let meta = "Observar emoções por 3 dias";
    let trilha = "Autoconhecimento";

    if (estadoAtual === "ansioso") {
      meta = "Respiração por 3 dias";
      trilha = "Controle da ansiedade";
    }
    else if (estadoAtual === "desmotivado") {
      meta = "Ação por 5 dias";
      trilha = "Produtividade";
    }
    else if (estadoAtual === "frustrado") {
      meta = "Reprogramação mental por 3 dias";
      trilha = "Mentalidade";
    }

    // 🧠 TOM DA IA
    let resposta = "🧠 NeuroMapa360 — IA Preditiva\n\n";

    if (tendencia === "queda") {
      resposta += "⚠️ Estou detectando um padrão de queda emocional.\n";
      resposta += "Se não ajustarmos agora, isso tende a se repetir.\n\n";
    }

    if (tendencia === "melhora") {
      resposta += "📈 Você está evoluindo emocionalmente.\n";
      resposta += "Continue reforçando esse comportamento.\n\n";
    }

    if (estadoAtual === "ansioso") {
      resposta += "Sua mente está acelerada. Vamos desacelerar.\n";
    }
    else if (estadoAtual === "desmotivado") {
      resposta += "Motivação vem depois da ação.\nComece pequeno.\n";
    }
    else if (estadoAtual === "frustrado") {
      resposta += "Frustração é desalinhamento de expectativa.\nVamos recalibrar.\n";
    }
    else {
      resposta += "Vamos manter consciência emocional.\n";
    }

    resposta += `\n🎯 Meta: ${meta}`;
    resposta += `\n🚀 Trilha: ${trilha}`;
    resposta += `\n🔥 Sequência atual: ${streak} dias`;

    res.json({
      resposta,
      meta,
      trilha,
      streak,
      tendencia
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
