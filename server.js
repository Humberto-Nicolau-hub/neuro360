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

// ⚠️ IMPORTANTE: webhook precisa vir ANTES do express.json()
app.post("/webhook-stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("❌ Erro webhook:", err.message);
    return res.status(400).send(`Webhook Error`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_details.email;

    console.log("💰 Pagamento confirmado:", email);

    await supabase
      .from("usuarios")
      .update({ plano: "premium" })
      .eq("email", email);
  }

  res.json({ received: true });
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
      .limit(plano === "premium" ? 10 : 3);

    const historicoTexto = historico?.map(h => h.texto).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        { role: "system", content: "Você é um especialista em PNL." },
        { role: "user", content: `${historicoTexto}\n${texto}` }
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
  const { user_id } = req.body;

  const { data } = await supabase
    .from("registros")
    .select("emocao, texto")
    .eq("user_id", user_id)
    .limit(10);

  const resumo = data?.map(d => d.texto).join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Gere um relatório emocional." },
      { role: "user", content: resumo }
    ]
  });

  res.json({ relatorio: completion.choices[0].message.content });
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

// 📧 CRON SEMANAL
cron.schedule("0 9 * * 1", async () => {
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, email")
    .eq("plano", "premium");

  for (const user of usuarios || []) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Seu relatório semanal",
      text: "Sua evolução emocional da semana está disponível.",
    });
  }
});

app.listen(3000, () => console.log("🚀 Server rodando"));
