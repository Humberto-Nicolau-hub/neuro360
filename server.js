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

  if (texto.includes("ansioso")) return "ansioso";
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
      .eq("usuario", email);

    const lista = historico || [];

    // 🧬 PERFIL PSICOLÓGICO
    let contagem = {};

    lista.forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;
    });

    let perfil = "em desenvolvimento";

    if (contagem["ansioso"] > 3) {
      perfil = "Ansioso antecipatório";
    }
    else if (contagem["desmotivado"] > 3) {
      perfil = "Oscilador de motivação";
    }
    else if (contagem["frustrado"] > 3) {
      perfil = "Reativo emocional";
    }

    // 🔥 FASE DO USUÁRIO
    let fase = "início";

    if (lista.length > 5) fase = "consciência";
    if (lista.length > 10) fase = "controle";
    if (lista.length > 20) fase = "transformação";

    // 🎯 META PERSONALIZADA
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

    // 🧠 RESPOSTA INTELIGENTE
    let resposta = `🧠 NeuroMapa360 — IA de Jornada\n\n`;

    resposta += `🧬 Perfil identificado: ${perfil}\n`;
    resposta += `📍 Fase atual: ${fase}\n\n`;

    if (fase === "início") {
      resposta += "Você está começando a entender seus padrões.\n";
    }
    else if (fase === "consciência") {
      resposta += "Você já percebe seus padrões — agora pode intervir.\n";
    }
    else if (fase === "controle") {
      resposta += "Você está assumindo controle emocional.\n";
    }
    else {
      resposta += "Você está em transformação emocional real.\n";
    }

    resposta += `\n🎯 Meta atual: ${meta}`;
    resposta += `\n🚀 Trilha: ${trilha}`;

    res.json({
      resposta,
      perfil,
      fase,
      meta,
      trilha
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
