const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 SUPABASE CONFIG (já com suas chaves)
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_secret_kwL3ZwIgZeRPIGLFaC-Y7w_oTjoAi3K"
);

// TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA QUE APRENDE COM FEEDBACK (FASE 6)
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    // 🔍 BUSCAR HISTÓRICO DO USUÁRIO
    const { data: historico, error } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({ erro: "Erro ao buscar histórico" });
    }

    // 🧠 APRENDIZADO POR PONTUAÇÃO
    let pontuacao = {};

    (historico || []).forEach(item => {
      if (!pontuacao[item.trilha]) {
        pontuacao[item.trilha] = 0;
      }

      // Base
      pontuacao[item.trilha] += 1;

      // 🔥 Funcionou → aumenta muito peso
      if (item.eficaz) pontuacao[item.trilha] += 5;

      // ❌ Não funcionou → penaliza
      else pontuacao[item.trilha] -= 2;

      // 🎯 Contexto atual
      if (mensagem.toLowerCase().includes(item.estado)) {
        pontuacao[item.trilha] += 3;
      }
    });

    // 🧠 ESCOLHER MELHOR TRILHA
    let melhorTrilha = "Autoconhecimento";
    let maior = -Infinity;

    Object.keys(pontuacao).forEach(trilha => {
      if (pontuacao[trilha] > maior) {
        maior = pontuacao[trilha];
        melhorTrilha = trilha;
      }
    });

    // 🔍 DETECTAR ESTADO ATUAL
    const texto = mensagem.toLowerCase();

    let estadoAtual = "neutro";

    if (texto.includes("ansioso")) estadoAtual = "ansioso";
    else if (texto.includes("cansado")) estadoAtual = "cansado";
    else if (texto.includes("desmotivado")) estadoAtual = "desmotivado";
    else if (texto.includes("sem foco")) estadoAtual = "sem_foco";

    // 🧠 RESPOSTA FINAL INTELIGENTE
    const resposta = `
🧠 NeuroMapa360 — IA Adaptativa

📍 Estado atual: ${estadoAtual}

📊 Com base no seu histórico REAL:
A melhor trilha para você agora é:

👉 ${melhorTrilha}

💡 Essa recomendação foi ajustada automaticamente com base no que realmente funcionou para você.

Quanto mais você usa, mais inteligente a IA fica.
`;

    return res.json({
      resposta,
      trilha: melhorTrilha,
      estado: estadoAtual
    });

  } catch (error) {
    console.error("Erro geral:", error);
    return res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// 🚀 PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
