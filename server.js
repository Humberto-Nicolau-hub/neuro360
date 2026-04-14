import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 CONFIGURAÇÃO SEGURA
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Variáveis do Supabase não configuradas");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔍 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

// 🤖 ENDPOINT IA
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    console.log("📩 REQUEST:", req.body);

    // 🔥 VALIDAÇÃO
    if (!texto) {
      return res.status(400).json({ erro: "Texto é obrigatório" });
    }

    // 🧠 RESPOSTA SIMULADA (depois entra OpenAI)
    const respostaIA = `Entendo que você está ${emocao}. Vamos trabalhar isso juntos. 💡`;

    // 💾 SALVAR NO SUPABASE
    const { data, error } = await supabase
      .from("registros")
      .insert([
        {
          user_id: user_id || null,
          emocao,
          texto,
          resposta: respostaIA,
        },
      ])
      .select();

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      return res.status(500).json({ erro: error.message });
    }

    console.log("✅ SALVO NO BANCO");

    return res.json({ resposta: respostaIA });

  } catch (err) {
    console.error("🔥 ERRO GERAL:", err);
    return res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
