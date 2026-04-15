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

// 🔥 FUNÇÃO: verificar plano do usuário
async function getPlano(user_id) {
  if (!user_id) return "free";

  const { data } = await supabase
    .from("usuarios")
    .select("plano")
    .eq("id", user_id)
    .single();

  return data?.plano || "free";
}

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    console.log("BODY:", req.body);

    // 🔎 PLANO
    const plano = await getPlano(user_id);

    // 🧠 HISTÓRICO (diferente por plano)
    let historicoTexto = "";
    let limite = plano === "premium" ? 10 : 3;

    const { data: historico } = await supabase
      .from("registros")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(limite);

    if (historico) {
      historicoTexto = historico
        .map(h => `Emoção: ${h.emocao} | Texto: ${h.texto}`)
        .join("\n");
    }

    // 🎯 PROMPT DIFERENCIADO
    const prompt = `
Você é um especialista em inteligência emocional, PNL e desenvolvimento pessoal.

Plano do usuário: ${plano}

Histórico:
${historicoTexto}

Situação atual:
Emoção: ${emocao}
Texto: ${texto}

${
  plano === "premium"
    ? "Responda com máxima profundidade, análise emocional e orientação prática detalhada."
    : "Responda de forma útil e acolhedora."
}
`;

    // 🤖 IA COM DIFERENCIAÇÃO REAL
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: plano === "premium" ? 0.7 : 0.5,
    });

    const resposta = completion.choices[0].message.content;

    // 💾 SALVAR
    await supabase.from("registros").insert([
      {
        user_id,
        emocao,
        texto,
        resposta,
        plano,
      },
    ]);

    return res.json({ resposta, plano });

  } catch (err) {
    console.error("ERRO:", err);
    return res.status(500).json({ erro: "Erro na IA" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server rodando na porta", PORT);
});
