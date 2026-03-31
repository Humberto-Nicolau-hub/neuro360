const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 CONFIGURAÇÃO SUPABASE (SUBSTITUA COM OS SEUS DADOS)
const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_secret_0Bw5qBFgIWB3fLgFc_lNlA_x2XmaHbQ"
);

// TESTE DE VIDA
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA COM MEMÓRIA REAL + PADRÃO EMOCIONAL
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    // 🔥 BUSCAR HISTÓRICO REAL NO SUPABASE
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    let contagem = {};

    (historico || []).forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;
    });

    let padrao = "neutro";

    if (Object.keys(contagem).length > 0) {
      padrao = Object.keys(contagem).reduce((a, b) =>
        contagem[a] > contagem[b] ? a : b
      );
    }

    // 🔍 DETECÇÃO DO ESTADO ATUAL
    const texto = mensagem.toLowerCase();

    let estadoAtual = "neutro";

    if (texto.includes("ansioso")) estadoAtual = "ansioso";
    else if (texto.includes("cansado")) estadoAtual = "cansado";
    else if (texto.includes("desmotivado")) estadoAtual = "desmotivado";
    else if (texto.includes("sem foco")) estadoAtual = "sem_foco";

    // 🧠 IA ADAPTATIVA
    let resposta = "";

    if (estadoAtual === "ansioso") {
      if (padrao === "ansioso") {
        resposta = "Percebo que a ansiedade está se repetindo no seu histórico. Isso indica um padrão emocional importante. Vamos trabalhar isso com mais profundidade agora.";
      } else {
        resposta = "Você está ansioso neste momento. Vamos desacelerar com uma respiração profunda.";
      }
    } 
    else if (estadoAtual === "desmotivado") {
      resposta = "Você já apresentou momentos semelhantes antes. A chave aqui é ação pequena e consistente.";
    } 
    else if (estadoAtual === "cansado") {
      resposta = "Seu corpo está pedindo pausa. Isso não é fraqueza, é inteligência do sistema.";
    } 
    else if (estadoAtual === "sem_foco") {
      resposta = "Sua mente está dispersa. Escolha uma única prioridade agora.";
    } 
    else {
      resposta = "Estou analisando seu padrão emocional. Me conte mais para te orientar melhor.";
    }

    res.json({
      resposta: resposta,
      padrao_detectado: padrao,
      estado_atual: estadoAtual
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
