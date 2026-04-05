const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase conectado");
} else {
  console.log("⚠️ Supabase NÃO configurado");
}

// 🧠 IA SIMPLES
function gerarRespostaIA(texto) {
  if (!texto) return "Me diga como você está se sentindo.";

  const t = texto.toLowerCase();

  if (t.includes("ansioso")) {
    return "Respire fundo. Você não está sozinho. Vamos focar no presente.";
  }

  if (t.includes("desmotivado")) {
    return "Pequenos passos ainda são progresso. Comece com algo simples hoje.";
  }

  if (t.includes("triste")) {
    return "Se permita sentir, mas não permaneça aí. Você é maior que esse momento.";
  }

  return "Estou aqui com você. Vamos evoluir juntos um passo de cada vez.";
}

// 🔥 ROTA PRINCIPAL (PADRONIZADA)
app.post("/chat", async (req, res) => {
  try {
    console.log("📩 BODY RECEBIDO:", req.body);

    // aceita os dois formatos
    const texto = req.body.texto || req.body.mensagem;
    const email = req.body.email || "anonimo";

    if (!texto) {
      return res.status(400).json({
        error: "Texto não enviado"
      });
    }

    const resposta = gerarRespostaIA(texto);

    // 💾 salvar no Supabase (se existir)
    if (supabase) {
      try {
        await supabase.from("feedbacks").insert([
          {
            usuario: email,
            estado: texto,
            resposta: resposta
          }
        ]);
      } catch (dbError) {
        console.log("⚠️ Erro ao salvar no banco:", dbError.message);
      }
    }

    res.json({ resposta });

  } catch (error) {
    console.error("❌ ERRO GERAL:", error);
    res.status(500).json({
      error: "Erro interno no servidor"
    });
  }
});

// 🔥 TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 Backend Rodando 🚀");
});

// 🚀 START
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
