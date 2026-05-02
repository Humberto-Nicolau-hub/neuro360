import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IA
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id, historico } = req.body;

    if (!texto) {
      return res.json({ resposta: "Fale comigo..." });
    }

    // memória
    const { data: memoria } = await supabase
      .from("memoria_ia")
      .select("texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const contextoMemoria = memoria?.map(m => m.texto).join("\n") || "";

    const contextoChat = historico
      ?.map(m => `${m.tipo}: ${m.texto}`)
      .join("\n") || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é uma IA terapêutica empática. Use o histórico e contexto abaixo:\n${contextoMemoria}\n${contextoChat}`
        },
        {
          role: "user",
          content: `${emocao}: ${texto}`
        }
      ],
    });

    const resposta =
      completion?.choices?.[0]?.message?.content ||
      "Estou aqui com você.";

    // salvar memória
    if(user_id){
      await supabase.from("memoria_ia").insert({
        user_id,
        texto
      });
    }

    return res.json({ resposta });

  } catch (err) {

    console.log("ERRO IA:", err);

    return res.json({
      resposta: "Tive um erro, mas continuo aqui com você."
    });
  }
});

// ADMIN
app.get("/admin-metricas", async (req, res) => {
  try {

    const { count: usuarios } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: registros } = await supabase
      .from("registros")
      .select("*", { count: "exact", head: true });

    const { count: ia } = await supabase
      .from("memoria_ia")
      .select("*", { count: "exact", head: true });

    res.json({ usuarios, registros, ia });

  } catch {

    res.json({ usuarios: 0, registros: 0, ia: 0 });

  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Servidor rodando");
});
