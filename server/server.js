import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";

dotenv.config();

const app = express();

/* =========================
   🔐 STRIPE CONFIG
========================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/* =========================
   🔗 SUPABASE ADMIN
========================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   ⚠️ WEBHOOK (ANTES DO JSON)
========================= */
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("📩 Evento Stripe:", event.type);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const user_id = session?.metadata?.user_id;

        if (!user_id) {
          console.log("⚠️ user_id não encontrado no webhook");
          return res.json({ received: true });
        }

        const { error } = await supabase
          .from("profiles")
          .update({ plano: "premium" })
          .eq("id", user_id);

        if (error) {
          console.error("❌ Erro ao atualizar plano:", error.message);
        } else {
          console.log("✅ Usuário virou PREMIUM:", user_id);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ ERRO WEBHOOK:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

/* =========================
   🔓 MIDDLEWARES
========================= */
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

/* =========================
   🤖 OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   🔐 VALIDAR USUÁRIO (CORRIGIDO)
========================= */
const validarUsuarioPremium = async (user_id) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("plano, is_admin")
      .eq("id", user_id);

    if (error) {
      console.error("❌ ERRO AO BUSCAR USUÁRIO:", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.log("⚠️ Usuário não encontrado:", user_id);
      return null;
    }

    return data[0]; // pega o primeiro com segurança

  } catch (err) {
    console.error("❌ ERRO INTERNO VALIDAR USUÁRIO:", err.message);
    return null;
  }
};

/* =========================
   💳 CHECKOUT STRIPE
========================= */
app.post("/create-checkout", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({
        error: "Dados inválidos",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        user_id,
      },
      success_url: process.env.FRONTEND_URL,
      cancel_url: process.env.FRONTEND_URL,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ ERRO CHECKOUT:", err.message);
    res.status(500).json({ error: "Erro ao criar checkout" });
  }
});

/* =========================
   🤖 IA (ESTÁVEL)
========================= */
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    if (!texto || !emocao || !user_id) {
      return res.status(400).json({
        error: "Dados incompletos",
      });
    }

    console.log("📥 Requisição IA:", { user_id, emocao });

    const user = await validarUsuarioPremium(user_id);

    console.log("👤 USER:", user);

    // 🔴 USUÁRIO NÃO EXISTE → NÃO QUEBRA MAIS
    if (!user) {
      console.log("⚠️ Criando fallback FREE");

      // fallback padrão (não trava IA)
      const fallbackUser = {
        plano: "free",
        is_admin: false
      };

      return executarIA(fallbackUser, texto, emocao, res);
    }

    return executarIA(user, texto, emocao, res);

  } catch (err) {
    console.error("❌ ERRO IA:", err.message);
    res.status(500).json({ error: "Erro na IA" });
  }
});

/* =========================
   🤖 FUNÇÃO IA
========================= */
const executarIA = async (user, texto, emocao, res) => {
  try {

    if (user.is_admin) {
      console.log("👑 ADMIN LIBERADO");
    } else if (user.plano === "premium") {
      console.log("💎 PREMIUM LIBERADO");
    } else {
      console.log("🆓 FREE (controle no frontend)");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em PNL, inteligência emocional e reprogramação mental.",
        },
        {
          role: "user",
          content: `Estou me sentindo ${emocao}. ${texto}`,
        },
      ],
    });

    return res.json({
      resposta: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error("❌ ERRO OPENAI:", err.message);
    return res.status(500).json({
      error: "Erro ao gerar resposta",
    });
  }
};

/* =========================
   🚀 SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
