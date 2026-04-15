import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";
import cron from "node-cron";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🤖 OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 💳 STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

// 🧠 IA
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

// 💳 STRIPE CHECKOUT
app.post("/create-checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "NeuroMapa360 Premium",
            },
            unit_amount: 1990,
          },
          quantity: 1,
        },
      ],
      success_url: "https://neuro360.vercel.app?success=true",
      cancel_url: "https://neuro360.vercel.app",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro pagamento" });
  }
});

// 📊 DADOS PARA GRÁFICO
app.post("/grafico", async (req, res) => {
  const { user_id } = req.body;

  const { data } = await supabase
    .from("registros")
    .select("emocao, created_at")
    .eq("user_id", user_id);

  return res.json({ data });
});

// 📅 CRON (relatório semanal base)
cron.schedule("0 9 * * 1", async () => {
  console.log("Relatório semanal rodando...");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
