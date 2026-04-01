const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 SUPABASE (via ENV - correto e seguro)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 Perfil IA 🚀");
});

// 🧠 IA COMPLETA (PERFIL + EVOLUÇÃO + METAS)
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const texto = mensagem.toLowerCase();

    // 🔍 HISTÓRICO
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    let contagem = {};

    (historico || []).forEach(item => {
      contagem[item.estado] = (contagem[item.estado] || 0) + 1;
    });

    // 🔥 PADRÃO DOMINANTE
    let padrao = "equilibrado";

    if (Object.keys(contagem).length > 0) {
      padrao = Object.keys(contagem).reduce((a, b) =>
        contagem[a] > contagem[b] ? a : b
      );
    }

    // 🔍 ESTADO ATUAL
    let estado = "neutro";

    if (texto.includes("ansioso")) estado = "ansioso";
    else if (texto.includes("medo")) estado = "medo";
    else if (texto.includes("triste")) estado = "triste";
    else if (texto.includes("raiva")) estado = "raiva";
    else if (texto.includes("desmotivado")) estado = "desmotivado";
    else if (texto.includes("cansado")) estado = "cansado";
    else if (texto.includes("sem foco")) estado = "sem_foco";

    // 🧠 PERFIL PSICOLÓGICO
    let perfil = "";

    if (padrao === "ansioso") {
      perfil = "Tendência à ansiedade antecipatória";
    } else if (padrao === "desmotivado") {
      perfil = "Oscilação entre ação e desmotivação";
    } else if (padrao === "sem_foco") {
      perfil = "Dificuldade de manter constância";
    } else {
      perfil = "Perfil emocional equilibrado em construção";
    }

    // 📈 EVOLUÇÃO
    let evolucao = "";

    if (historico && historico.length > 5) {
      evolucao = "Você já está criando um padrão de evolução emocional consistente.";
    } else {
      evolucao = "Você está no início do seu processo de evolução.";
    }

    // 🎯 METAS INTELIGENTES
    let meta = "";
    let trilha = "";

    switch (estado) {
      case "ansioso":
        meta = "Reduzir ansiedade com respiração guiada por 3 dias";
        trilha = "Respiração + controle emocional";
        break;

      case "medo":
        meta = "Enfrentar pequenos medos progressivamente por 5 dias";
        trilha = "Reprogramação de medo";
        break;

      case "raiva":
        meta = "Controlar reações impulsivas por 3 dias";
        trilha = "Controle emocional";
        break;

      case "triste":
        meta = "Elevar energia emocional com gratidão por 5 dias";
        trilha = "Elevação emocional";
        break;

      case "desmotivado":
        meta = "Executar micro ações por 5 dias consecutivos";
        trilha = "Ação e disciplina";
        break;

      case "cansado":
        meta = "Recuperar energia com pausas estratégicas";
        trilha = "Regulação de energia";
        break;

      case "sem_foco":
        meta = "Aplicar técnica Pomodoro por 3 dias";
        trilha = "Foco profundo";
        break;

      default:
        meta = "Observar emoções e registrar por 3 dias";
        trilha = "Autoconhecimento";
    }

    // 🧠 RESPOSTA FINAL COMPLETA
    const resposta = `
🧠 NeuroMapa360 — IA Evolutiva Profunda

📍 Estado atual: ${estado}

🧬 Seu padrão emocional:
${perfil}

📊 Evolução:
${evolucao}

🎯 Meta recomendada:
${meta}

🚀 Trilha ideal:
${trilha}

Você não é seu estado atual.
Você é o padrão que repete — e hoje você começou a mudar isso.
`;

    res.json({
      resposta,
      estado,
      padrao,
      meta,
      trilha
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// 🚀 PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
