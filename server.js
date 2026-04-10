import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🔐 ENV
========================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log("SUPABASE_URL:", SUPABASE_URL ? "OK" : "MISSING");
console.log("SUPABASE_KEY:", SUPABASE_KEY ? "OK" : "MISSING");

/* =========================
   🚀 CLIENT
========================= */

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* =========================
   🧠 ROTA TESTE SIMPLES
========================= */

app.post("/ia", async (req, res) => {
  try {
    console.log("🔥 TESTE SUPABASE");

    // 👉 TESTE FIXO (SEM FRONTEND)
    const { data, error } = await supabase
      .from("registros")
      .insert([
        {
          user_id: "00000000-0000-0000-0000-000000000000",
          emocao: "teste",
          texto: "teste",
          resposta: "Teste Supabase OK 🚀",
        },
      ])
      .select();

    if (error) {
      console.error("❌ ERRO SUPABASE:", error);
      return res.status(500).json({
        erro: error.message,
      });
    }

    console.log("✅ SALVO:", data);

    return res.json({
      resposta: "Salvou no banco 🚀",
    });

  } catch (err) {
    console.error("🔥 ERRO GERAL:", err);
    return res.status(500).json({
      erro: "Erro interno",
    });
  }
});

/* =========================
   🚀 START
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server rodando na porta", PORT);
});
