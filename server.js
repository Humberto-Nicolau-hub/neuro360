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

// ⚠️ IMPORTANTE PARA STRIPE WEBHOOK
app.use("/webhook-stripe", express.raw({ type: "application/json" }));

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

// 🧠 MAPA DE SCORE
const mapaScore = {
  Feliz: 3,
  Ansioso: 1,
  Triste: 0,
  Cansado: 1,
};

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

// 🧠 IA + SCORE + LIMITADOR
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    const plano = await getPlano(user_id);

    // 🔒 LIMITADOR FREE
    if (plano !== "premium") {
      const hoje = new Date().toISOString().split("T")[0];

      const { count } = await supabase
        .from("registros")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id)
        .gte("created_at", hoje);

      if (count >= 5) {
        return res.json({
          resposta: "🔒 Limite FREE atingido. Faça upgrade para continuar.",
          plano,
          bloqueado: true,
        });
      }
    }

    // HISTÓRICO
    const { data: historico } = await supabase
      .from("registros")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(plano === "premium" ? 10 : 3);

    const historicoTexto = historico
      ?.map(h => `${h.emocao}: ${h.texto}`)
      .join("\n");

    // 🤖 IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: plano === "premium" ? 0.7 : 0.5,
      messages: [
        {
          role: "system",
          content: "Você é especialista em PNL, inteligência emocional e comportamento humano.",
        },
        {
          role: "user",
          content: `
Histórico:
${historicoTexto}

Emoção atual: ${emocao}
Texto: ${texto}
`,
        },
      ],
    });

    const resposta = completion.choices[0].message.content;

    // SCORE
    const score = mapaScore[emocao] ?? 1;

    await supabase.from("registros").insert([
      { user_id, emocao, texto, resposta, score, plano },
    ]);

    return res.json({ resposta, plano });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: "Erro IA" });
  }
});

// 📊 DASHBOARD + SCORE
app.post("/dashboard", async (req, res) => {
  const { user_id } = req.body;

  const { data } = await supabase
    .from("registros")
    .select("emocao, score, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: true });

  return res.json({ dados: data });
});

// 📊 RELATÓRIO
app.post("/relatorio", async (req, res) => {
  const { user_id } = req.body;

  const { data: registros } = await supabase
    .from("registros")
    .select("emocao, texto")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const resumo = registros
    ?.map(r => `${r.emocao}: ${r.texto}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Analise emocional com PNL.",
      },
      {
        role: "user",
        content: resumo,
      },
    ],
  });

  return res.json({
    relatorio: completion.choices[0].message.content,
  });
});

// 💳 STRIPE CHECKOUT
app.post("/create-checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: { name: "NeuroMapa360 Premium" },
          unit_amount: 1990,
        },
        quantity: 1,
      },
    ],
    success_url: "https://neuro360.vercel.app?success=true",
    cancel_url: "https://neuro360.vercel.app",
  });

  res.json({ url: session.url });
});

// 🔥 WEBHOOK STRIPE (ATIVA PREMIUM)
app.post("/webhook-stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email = session.customer_details.email;

      await supabase
        .from("usuarios")
        .update({ plano: "premium" })
        .eq("email", email);
    }

    res.json({ received: true });

  } catch (err) {
    console.error(err);
    res.status(400).send(`Webhook error`);
  }
});

// 📅 RELATÓRIO SEMANAL AUTOMÁTICO
cron.schedule("0 9 * * 1", async () => {
  console.log("📅 Envio semanal iniciado");

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, email, plano");

  for (const user of usuarios) {
    try {
      const { data: registros } = await supabase
        .from("registros")
        .select("emocao, texto")
        .eq("user_id", user.id)
        .limit(10);

      if (!registros || registros.length === 0) continue;

      const resumo = registros
        .map(r => `${r.emocao}: ${r.texto}`)
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Resumo emocional semanal.",
          },
          {
            role: "user",
            content: resumo,
          },
        ],
      });

      let textoEmail = completion.choices[0].message.content;

      if (user.plano !== "premium") {
        textoEmail += "\n\n🔒 Faça upgrade para análises mais profundas.";
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "📊 Seu Relatório Semanal",
        text: textoEmail,
      });

    } catch (err) {
      console.error(err);
    }
  }
});

// 🚀 START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando 🚀"));
