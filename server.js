const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// 🧠 FUNÇÃO SIMPLES DE IA (SEM OPENAI POR ENQUANTO)
function gerarRespostaIA(texto) {
  if (!texto) return "Me diga como você está se sentindo.";

  if (texto.includes("ansioso")) {
    return "Respire fundo. Você não está sozinho. Vamos focar no presente.";
  }

  if (texto.includes("desmotivado")) {
    return "Pequenos passos ainda são progresso. Comece com algo simples hoje.";
  }

  if (texto.includes("triste")) {
    return "Se permita sentir, mas não permaneça aí. Você é maior que esse momento.";
  }

  return "Estou aqui com você. Vamos evoluir juntos um passo de cada vez.";
}

// 🔥 ROTA IA (ESSA É A MAIS IMPORTANTE)
app.post("/ia", async (req, res) => {
  try {
    const { texto, email } = req.body;

    const resposta = gerarRespostaIA(texto);

    // salva no banco (opcional, mas já deixei pronto)
    if (email) {
      await supabase.from("feedbacks").insert([
        {
          usuario: email,
          estado: texto,
          resposta: resposta
        }
      ]);
    }

    res.json({ resposta });

  } catch (error) {
    console.error("ERRO IA:", error);
    res.status(500).json({ erro: "Erro ao processar IA" });
  }
});

// 🔥 TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 Backend Rodando 🚀");
});

// PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
