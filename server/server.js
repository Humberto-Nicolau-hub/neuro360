import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";

dotenv.config();

const app = express();

// 🔐 STRIPE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔗 SUPABASE (admin)
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const user_id = session?.metadata?.user_id;

      if (user_id) {
        await supabase
          .from("profiles")
          .update({ plano: "premium" })
          .eq("id", user_id);

        console.log("✅ Usuário virou premium:", user_id);
      }
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

// 💳 CHECKOUT (AGORA ASSINATURA)
app.post("/create-checkout", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // 🔥 CORREÇÃO PRINCIPAL
      customer_email: email,

      line_items: [
        {
          price: "SEU_PRICE_ID_AQUI", // ⚠️ COLOQUE O DO STRIPE
          quantity: 1,
        },
      ],

      metadata: { user_id },

      success_url: "https://neuro360.vercel.app",
      cancel_url: "https://neuro360.vercel.app",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no checkout" });
  }
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server rodando"));
