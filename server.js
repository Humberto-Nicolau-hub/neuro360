const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA COM MEMÓRIA SIMULADA + PADRÃO
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem) {
      return res.status(400).json({ erro: "Mensagem vazia" });
    }

    const texto = mensagem.toLowerCase();

    // 🔍 DETECÇÃO ATUAL
    let perfilAtual = "neutro";

    if (texto.includes("ansioso")) perfilAtual = "ansiedade";
    else if (texto.includes("cansado")) perfilAtual = "fadiga";
    else if (texto.includes("desmotivado")) perfilAtual = "baixa motivação";
    else if (texto.includes("sem foco")) perfilAtual = "falta de clareza";

    // 🧠 MEMÓRIA (simulação inteligente)
    let historicoFrequente = "neutro";

    if (perfilAtual === "ansiedade") {
      historicoFrequente = "ansiedade";
    }

    // 🎯 RESPOSTA ADAPTATIVA
    let respostaIA = "";

    if (perfilAtual === "ansiedade") {
      if (historicoFrequente === "ansiedade") {
        respostaIA = `Percebo que a ansiedade está se repetindo. Isso indica um padrão emocional. Vamos trabalhar isso com respiração consciente e redução de estímulos.`;
      } else {
        respostaIA = `Você está com sinais de ansiedade agora. Vamos desacelerar com respiração profunda.`;
      }
    } 
    else if (perfilAtual === "fadiga") {
      respostaIA = `Seu sistema está pedindo recuperação. Isso não é fraqueza, é inteligência do corpo. Faça uma pausa estratégica.`;
    } 
    else if (perfilAtual === "baixa motivação") {
      respostaIA = `A motivação nasce da ação. Comece com 5 minutos agora. Isso já muda seu estado interno.`;
    } 
    else if (perfilAtual === "falta de clareza") {
      respostaIA = `Sua mente está sobrecarregada. Escolha apenas uma prioridade agora. Clareza vem da ação focada.`;
    } 
    else {
      respostaIA = `Estou aqui com você. Me conte mais para eu te orientar com mais precisão.`;
    }

    res.json({
      resposta: respostaIA,
      perfil_detectado: perfilAtual,
      padrao_detectado: historicoFrequente
    });

  } catch (error) {
    console.error("Erro IA:", error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
