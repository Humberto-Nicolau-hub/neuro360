const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 CONFIGURE AQUI SEU SUPABASE
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_secret_kwL3ZwIgZeRPIGLFaC-Y7w_oTjoAi3K"
);

// TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA PREDITIVA + MEMÓRIA REAL
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    // 🔥 BUSCAR HISTÓRICO REAL DO USUÁRIO
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    let contagem = {};
    let tendenciaNegativa = 0;

    (historico || []).forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;

      if (
        item.estado === "ansioso" ||
        item.estado === "desmotivado"
      ) {
        tendenciaNegativa++;
      }
    });

    // 🔍 PADRÃO DOMINANTE
    let padrao = "neutro";

    if (Object.keys(contagem).length > 0) {
      padrao = Object.keys(contagem).reduce((a, b) =>
        contagem[a] > contagem[b] ? a : b
      );
    }

    // 🔍 ESTADO ATUAL (MENSAGEM)
    const texto = mensagem.toLowerCase();

    let atual = "neutro";

    if (texto.includes("ansioso")) atual = "ansioso";
    else if (texto.includes("cansado")) atual = "cansado";
    else if (texto.includes("desmotivado")) atual = "desmotivado";
    else if (texto.includes("sem foco")) atual = "sem_foco";

    // 🔮 PREVISÃO
    let previsao = "";

    if (tendenciaNegativa >= 3) {
      previsao = "Alta chance de repetição de padrão emocional negativo";
    }

    // 🎯 RECOMENDAÇÃO AUTOMÁTICA
    let recomendacao = "";

    if (padrao === "ansioso") {
      recomendacao = "Respiração guiada + reduzir estímulos";
    } 
    else if (padrao === "desmotivado") {
      recomendacao = "Ação de 5 minutos + micro metas";
    } 
    else if (padrao === "sem_foco") {
      recomendacao = "Técnica Pomodoro (25 minutos de foco)";
    } 
    else {
      recomendacao = "Autoconhecimento e observação emocional";
    }

    // 🧠 RESPOSTA INTELIGENTE
    let resposta = `
🧠 Análise do seu padrão:

• Padrão dominante: ${padrao}
• Estado atual: ${atual}

${previsao ? "⚠️ Tendência detectada: " + previsao : ""}

🎯 Recomendação prática:
${recomendacao}

Você não está apenas reagindo ao momento — está construindo padrões. Vamos ajustar isso juntos.
`;

    res.json({
      resposta,
      padrao,
      atual,
      previsao,
      recomendacao
    });

  } catch (error) {
    console.error("Erro no backend:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// 🚀 PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
