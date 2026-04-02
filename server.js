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

// 🧠 DETECÇÃO INTELIGENTE
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  const estados = {
    ansioso: ["ansioso", "ansiedade", "nervoso", "preocupado"],
    medo: ["medo", "inseguro", "receio", "assustado"],
    triste: ["triste", "deprimido", "pra baixo", "desanimado"],
    raiva: ["raiva", "irritado", "estressado", "bravo"],
    desmotivado: ["desmotivado", "sem vontade", "preguiça", "desânimo"],
    cansado: ["cansado", "esgotado", "sem energia"],
    sem_foco: ["sem foco", "distraído", "não consigo focar"]
  };

  for (let estado in estados) {
    if (estados[estado].some(p => texto.includes(p))) {
      return estado;
    }
  }

  return "neutro";
}

app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    const estado = detectarEstado(mensagem);

    // 🔍 HISTÓRICO
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    // 🧠 PERFIL
    let perfil = "Perfil em construção";

    if (historico && historico.length > 5) {
      perfil = "Você já demonstra padrões emocionais consistentes";
    }

    // 🎯 METAS + RESPOSTA PERSONALIZADA
    let resposta = "";
    let meta = "";
    let trilha = "";

    if (estado === "ansioso") {
      resposta = "Percebo sinais de ansiedade. Vamos desacelerar sua mente agora.";
      meta = "Controlar ansiedade por 3 dias com respiração guiada";
      trilha = "Respiração + relaxamento";
    }

    else if (estado === "desmotivado") {
      resposta = "Você está com baixa motivação — precisamos gerar movimento.";
      meta = "Executar pequenas ações por 5 dias";
      trilha = "Ação e disciplina";
    }

    else if (estado === "medo") {
      resposta = "O medo está ativo — vamos trazer sensação de segurança.";
      meta = "Enfrentar pequenos desafios por 5 dias";
      trilha = "Reprogramação de medo";
    }

    else if (estado === "triste") {
      resposta = "Percebo tristeza — vamos elevar sua energia emocional.";
      meta = "Praticar gratidão por 5 dias";
      trilha = "Elevação emocional";
    }

    else if (estado === "raiva") {
      resposta = "Você está sob tensão — vamos reduzir essa carga.";
      meta = "Controlar reações por 3 dias";
      trilha = "Controle emocional";
    }

    else {
      resposta = "Vamos observar seu estado com consciência.";
      meta = "Registrar emoções por 3 dias";
      trilha = "Autoconhecimento";
    }

    const respostaFinal = `
🧠 NeuroMapa360 — IA Inteligente

📍 Estado identificado: ${estado}

${resposta}

🎯 Meta:
${meta}

🚀 Trilha:
${trilha}

${perfil}
`;

    res.json({
      resposta: respostaFinal,
      estado,
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
