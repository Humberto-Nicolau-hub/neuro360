import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";
import cron from "node-cron";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

// ⚠️ WEBHOOK ANTES DO JSON
app.post("/webhook-stripe", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_details.email;

      await supabase
        .from("usuarios")
        .update({ plano: "premium" })
        .eq("email", email);

      console.log("💰 Premium liberado:", email);
    }

    res.json({ received: true });

  } catch (err) {
    console.log("❌ Webhook erro:", err.message);
    res.status(400).send("Erro webhook");
  }
});

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

// 📧 EMAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔥 ROTA BASE (IMPORTANTE)
app.get("/", (req, res) => {
  res.send("API NeuroMapa360 rodando 🚀");
});

// 🔥 PLANO
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
      .select("texto")
      .eq("user_id", user_id)
      .limit(plano === "premium" ? 10 : 3);

    const contexto = historico?.map(h => h.texto).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Especialista em PNL" },
        { role: "user", content: `${contexto}\n${texto}` }
      ]
    });

    const resposta = completion.choices[0].message.content;

    await supabase.from("registros").insert([
      { user_id, emocao, texto, resposta, plano }
    ]);

    res.json({ resposta, plano });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro IA" });
  }
});

// 📊 RELATÓRIO
app.post("/relatorio", async (req, res) => {
  try {
    const { user_id } = req.body;

    const { data } = await supabase
      .from("registros")
      .select("texto")
      .eq("user_id", user_id)
      .limit(10);

    const resumo = data?.map(d => d.texto).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Gerar relatório emocional" },
        { role: "user", content: resumo }
      ]
    });

    res.json({ relatorio: completion.choices[0].message.content });

  } catch {
    res.status(500).json({ erro: "Erro relatório" });
  }
});

// 💳 CHECKOUT
app.post("/create-checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "brl",
        product_data: { name: "Premium NeuroMapa360" },
        unit_amount: 1990,
      },
      quantity: 1,
    }],
    success_url: "https://neuro360.vercel.app",
    cancel_url: "https://neuro360.vercel.app",
  });

  res.json({ url: session.url });
});

// 🚀 PORTA DINÂMICA (ESSENCIAL)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server rodando na porta", PORT);
});
