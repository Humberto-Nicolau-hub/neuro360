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

// 🔥 VERIFICAR PLANO
async function getPlano(user_id) {
  if (!user_id) return "free";

  const { data } = await supabase
    .from("usuarios")
    .select("plano")
    .eq("id", user_id)
    .single();

  return data?.plano || "free";
}

// 🧠 IA PRINCIPAL
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    const plano = await getPlano(user_id);

    const { data: historico } = await supabase
      .from("registros")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(plano === "premium" ? 10 : 3);

    const historicoTexto = historico
      ?.map(h => `Emoção: ${h.emocao} | ${h.texto}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: plano === "premium" ? 0.7 : 0.5,
      messages: [
        {
          role: "system",
          content: "Você é especialista em PNL e inteligência emocional."
        },
        {
          role: "user",
          content: `
Histórico:
${historicoTexto}

Emoção atual: ${emocao}
Texto: ${texto}
`
        }
      ]
    });

    const resposta = completion.choices[0].message.content;

    await supabase.from("registros").insert([
      { user_id, emocao, texto, resposta, plano }
    ]);

    return res.json({ resposta, plano });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro IA" });
  }
});

// 📊 RELATÓRIO
app.post("/relatorio", async (req, res) => {
  try {
    const { user_id } = req.body;

    const { data: historico } = await supabase
      .from("registros")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!historico || historico.length === 0) {
      return res.json({ relatorio: "Sem dados suficientes." });
    }

    const textoHistorico = historico
      .map(h => `Emoção: ${h.emocao} | ${h.texto}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
Você é especialista em análise emocional.

Gere um relatório com:
- padrão emocional
- dificuldades
- pontos positivos
- sugestão prática
`
        },
        {
          role: "user",
          content: textoHistorico
        }
      ]
    });

    const relatorio = completion.choices[0].message.content;

    return res.json({ relatorio });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro relatório" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
