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

app.get("/", (req, res) => {
  res.send("Neuro360 Perfil IA 🚀");
});

app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

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

    // 🧠 RESPOSTA FINAL
    const resposta = `
🧠 NeuroMapa360 — Análise Profunda

📍 Estado atual: ${estado}

🧬 Seu padrão emocional:
${perfil}

📊 Evolução:
${evolucao}

Você não é seu estado atual — você é o padrão que constrói.
`;

    res.json({ resposta });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
