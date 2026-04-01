const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 SUPABASE (via ENV - mais seguro)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA CORRIGIDA (PRIORIZA ESTADO ATUAL)
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    // 🔍 HISTÓRICO
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    // 🔍 DETECTAR ESTADO ATUAL (PRIORIDADE)
    const texto = mensagem.toLowerCase();

    let estadoAtual = "neutro";

    if (texto.includes("ansioso")) estadoAtual = "ansioso";
    else if (texto.includes("medo")) estadoAtual = "medo";
    else if (texto.includes("desmotivado")) estadoAtual = "desmotivado";
    else if (texto.includes("cansado")) estadoAtual = "cansado";
    else if (texto.includes("triste")) estadoAtual = "triste";
    else if (texto.includes("raiva")) estadoAtual = "raiva";
    else if (texto.includes("sem foco")) estadoAtual = "sem_foco";

    // 🎯 TRILHA BASE (AGORA CORRETA)
    let trilhaBase = "";

    if (estadoAtual === "ansioso") trilhaBase = "Respiração e Calma";
    else if (estadoAtual === "medo") trilhaBase = "Segurança e Controle";
    else if (estadoAtual === "desmotivado") trilhaBase = "Motivação e Ação";
    else if (estadoAtual === "cansado") trilhaBase = "Recuperação e Energia";
    else if (estadoAtual === "triste") trilhaBase = "Equilíbrio Emocional";
    else if (estadoAtual === "raiva") trilhaBase = "Controle Emocional";
    else if (estadoAtual === "sem_foco") trilhaBase = "Foco e Clareza";
    else trilhaBase = "Autoconhecimento";

    // 📊 AJUSTE COM HISTÓRICO (INTELIGÊNCIA)
    let ajuste = "";

    if (historico && historico.length > 0) {
      const eficazCount = historico.filter(i => i.eficaz).length;

      if (eficazCount > historico.length / 2) {
        ajuste = "\n💡 Baseado no seu histórico, você responde bem às práticas anteriores.";
      }
    }

    // 🧠 RESPOSTA INTELIGENTE
    const resposta = `
🧠 NeuroMapa360 — IA Terapêutica

📍 Identifiquei que você está: ${estadoAtual}

🎯 Vamos agir direto nisso:

👉 ${trilhaBase}

${ajuste}

Respire. Você não está preso a esse estado — está apenas passando por ele.
`;

    return res.json({
      resposta,
      estado: estadoAtual,
      trilha: trilhaBase
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro interno" });
  }
});

// 🚀 PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
