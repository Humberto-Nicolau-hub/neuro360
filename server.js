const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 VARIÁVEIS DE AMBIENTE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA ADAPTATIVA
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    let pontuacao = {};

    (historico || []).forEach(item => {
      if (!pontuacao[item.trilha]) {
        pontuacao[item.trilha] = 0;
      }

      pontuacao[item.trilha] += 1;

      if (item.eficaz) pontuacao[item.trilha] += 5;
      else pontuacao[item.trilha] -= 2;

      if (mensagem.toLowerCase().includes(item.estado)) {
        pontuacao[item.trilha] += 3;
      }
    });

    let melhorTrilha = "Autoconhecimento";
    let maior = -Infinity;

    Object.keys(pontuacao).forEach(trilha => {
      if (pontuacao[trilha] > maior) {
        maior = pontuacao[trilha];
        melhorTrilha = trilha;
      }
    });

    const resposta = `
🧠 IA NeuroMapa360

👉 Melhor trilha para você agora:
${melhorTrilha}

A IA está aprendendo com seu comportamento real.
`;

    res.json({ resposta });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
