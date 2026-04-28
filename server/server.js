import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";

dotenv.config();

const app = express();

// 🔐 STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// 🔗 SUPABASE (ADMIN - SERVICE ROLE)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ⚠️ WEBHOOK (ANTES DO JSON)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("📩 Evento recebido:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const user_id = session?.metadata?.user_id;

      if (!user_id) {
        console.log("⚠️ user_id não encontrado no metadata");
        return res.json({ received: true });
      }

      const { error } = await supabase
        .from("profiles")
        .update({ plano: "premium" })
        .eq("id", user_id);

      if (error) {
        console.error("Erro ao atualizar plano:", error.message);
      } else {
        console.log("✅ Usuário virou premium:", user_id);
      }
    }

    res.json({ received: true });

  } catch (err) {
    console.error("❌ Erro webhook:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// 🔓 MIDDLEWARES
app.use(cors());
app.use(express.json());

// 🤖 OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 💳 CHECKOUT STRIPE (ASSINATURA)
app.post("/create-checkout", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    // 🔒 VALIDAÇÃO
    if (!email || !user_id) {
      return res.status(400).json({
        error: "Dados inválidos (email ou user_id ausente)",
      });
    }

    console.log("🧾 Criando checkout para:", email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      customer_email: email,

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // 🔥 AGORA VEM DO ENV
          quantity: 1,
        },
      ],

      metadata: {
        user_id,
      },

      success_url: `${process.env.FRONTEND_URL}`,
      cancel_url: `${process.env.FRONTEND_URL}`,
    });

    console.log("✅ Checkout criado:", session.id);

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ ERRO STRIPE:", err.message);

    res.status(500).json({
      error: "Erro ao criar checkout",
      detalhe: err.message,
    });
  }
});

// 🤖 IA (mantido)
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em PNL e inteligência emocional.",
        },
        {
          role: "user",
          content: `Estou me sentindo ${emocao}. ${texto}`,
        },
      ],
    });

    res.json({
      resposta: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error("Erro IA:", err.message);
    res.status(500).json({ error: "Erro na IA" });
  }
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
