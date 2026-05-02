import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
}));

app.use(express.json());

if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL não definida");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida");
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não definida");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= IA ================= */

app.post("/ia", async (req, res) => {
  try {
    let { texto, emocao, user_id, historico } = req.body;

    if (!texto) return res.json({ resposta: "Fale comigo..." });
    if (!user_id) user_id = "anon";

    /* 🔥 VERIFICAR PLANO */
    let isPremium = false;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("plano")
        .eq("id", user_id)
        .single();

      if (data?.plano === "premium") isPremium = true;
    } catch {}

    /* 🔥 LIMITE FREE */
    if (!isPremium) {
      const { count } = await supabase
        .from("registros_emocionais")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id);

      if ((count || 0) >= 10) {
        return res.json({
          resposta: "Você atingiu o limite do plano free 🚀",
          limite: true
        });
      }
    }

    /* 🔥 IA */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Seja uma IA terapêutica empática." },
        { role: "user", content: `${emocao}: ${texto}` }
      ],
    });

    const resposta = completion.choices[0].message.content;

    await supabase.from("memoria_ia").insert({ user_id, texto });
    await supabase.from("registros_emocionais").insert({ user_id, emocao, texto });

    res.json({ resposta });

  } catch (err) {
    console.error(err);
    res.json({ resposta: "Erro, mas continuo com você." });
  }
});

/* ================= STRIPE ================= */

app.post("/criar-checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: process.env.FRONTEND_URL,
      cancel_url: process.env.FRONTEND_URL,
    });

    res.json({ url: session.url });

  } catch (err) {
    res.status(500).json({ error: "Erro checkout" });
  }
});

/* ================= WEBHOOK ================= */

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details.email;

    await supabase
      .from("profiles")
      .update({ plano: "premium" })
      .eq("email", email);
  }

  res.json({ received: true });
});

/* ================= ADMIN ================= */

app.get("/admin-metricas", async (req, res) => {
  const { count: usuarios } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: registros } = await supabase.from("registros_emocionais").select("*", { count: "exact", head: true });
  const { count: ia } = await supabase.from("memoria_ia").select("*", { count: "exact", head: true });

  res.json({ usuarios, registros, ia });
});

app.listen(process.env.PORT || 10000);
