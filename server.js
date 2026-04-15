import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    console.log("BODY:", req.body);

    // 🧠 BUSCAR HISTÓRICO
    let historicoTexto = "";

    if (user_id) {
      const { data: historico } = await supabase
        .from("registros")
        .select("emocao, texto")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (historico) {
        historicoTexto = historico
          .map(h => `Emoção: ${h.emocao} | Texto: ${h.texto}`)
          .join("\n");
      }
    }

    // 🤖 PROMPT INTELIGENTE
    const prompt = `
Você é um especialista em inteligência emocional, PNL e desenvolvimento pessoal.

Histórico recente do usuário:
${historicoTexto}

Situação atual:
Emoção: ${emocao}
Texto: ${texto}

Responda de forma:
- acolhedora
- profunda
- prática
- personalizada com base no histórico

Evite respostas genéricas.
`;

    // 🤖 IA REAL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5, // padrão free
    });

    const resposta = completion.choices[0].message.content;

    // 💾 SALVAR
    await supabase.from("registros").insert([
      {
        user_id,
        emocao,
        texto,
        resposta,
      },
    ]);

    return res.json({ resposta });

  } catch (err) {
    console.error("ERRO:", err);
    return res.status(500).json({ erro: "Erro na IA" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server rodando na porta", PORT);
});
