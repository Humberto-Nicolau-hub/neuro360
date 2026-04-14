import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    console.log("BODY:", req.body);

    const { data, error } = await supabase
      .from("registros")
      .insert([
        {
          user_id: user_id || null,
          emocao: emocao || "teste",
          texto: texto || "teste",
          resposta: "Funcionando 🚀",
        },
      ])
      .select();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return res.status(500).json({ erro: error.message });
    }

    return res.json({ resposta: "Funcionando 🚀" });

  } catch (err) {
    console.error("ERRO:", err);
    return res.status(500).json({ erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server rodando na porta", PORT);
});
