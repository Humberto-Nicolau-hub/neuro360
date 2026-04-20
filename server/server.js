import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

// 🔗 SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 💳 STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ WEBHOOK
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const user_id = session?.metadata?.user_id;

      if (!user_id) return res.status(400).send("user_id ausente");

      await supabase
        .from("profiles")
        .update({ plano: "premium" })
        .eq("id", user_id);
    }

    res.json({ received: true });

  } catch (err) {
    console.log("Erro webhook:", err.message);
    res.status(400).send("Erro webhook");
  }
});

app.use(cors());
app.use(express.json());

// 🤖 OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 PLANO
app.get("/plano/:user_id", async (req, res) => {
  const { user_id } = req.params;

  const { data } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user_id)
    .single();

  res.json({ plano: data?.plano || "free" });
});

// 🔥 EVOLUÇÃO (NOVO)
app.get("/evolucao/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data } = await supabase
      .from("registros")
      .select("emocao, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true })
      .limit(30);

    const mapa = {
      Ansioso: 2,
      Triste: 1,
      Estressado: 3,
      Feliz: 5
    };

    const evolucao = data.map(item => ({
      data: new Date(item.created_at).toLocaleDateString(),
      valor: mapa[item.emocao] || 3
    }));

    res.json(evolucao);

  } catch {
    res.status(500).json({ erro: "Erro evolução" });
  }
});

// 🧠 IA
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    const { data: perfil } = await supabase
      .from("profiles")
      .select("plano")
      .eq("id", user_id)
      .single();

    const plano = perfil?.plano || "free";

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

  } catch {
    res.status(500).json({ erro: "Erro IA" });
  }
});

// 📊 RELATÓRIO
app.post("/relatorio", async (req, res) => {
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
});

// 💳 CHECKOUT
app.post("/create-checkout", async (req, res) => {
  const { user_id } = req.body;

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
    metadata: { user_id },
    success_url: "https://neuro360.vercel.app",
    cancel_url: "https://neuro360.vercel.app",
  });

  res.json({ url: session.url });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server rodando"));
