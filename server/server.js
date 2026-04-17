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

      console.log("🧾 Metadata recebido:", session.metadata);
      console.log("👤 User ID:", user_id);

      if (!user_id) {
        console.log("❌ ERRO: user_id não veio no metadata");
        return res.status(400).send("user_id ausente");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ plano: "premium" })
        .eq("id", user_id)
        .select();

      if (error) {
        console.log("❌ Erro ao atualizar plano:", error);
        return res.status(500).send("Erro ao atualizar usuário");
      }

      console.log("💰 Premium liberado com sucesso:", data);
    }

    res.json({ received: true });

  } catch (err) {
    console.log("❌ Webhook erro:", err.message);
    res.status(400).send("Erro webhook");
  }
});

app.use(cors());
app.use(express.json());

// 🤖 OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📧 EMAIL (preparado para uso futuro)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔥 ROTA BASE
app.get("/", (req, res) => {
  res.send("API NeuroMapa360 rodando 🚀");
});

// 🔥 PEGAR PLANO
async function getPlano(user_id) {
  if (!user_id) return "free";

  const { data, error } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user_id)
    .single();

  if (error) {
    console.log("Erro ao buscar plano:", error);
    return "free";
  }

  return data?.plano || "free";
}

// 🧠 IA
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    const plano = await getPlano(user_id);

    console.log("🧠 Plano do usuário:", plano);

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
    console.error("Erro IA:", err);
    res.status(500).json({ erro: "Erro IA" });
  }
});

// 📊 RELATÓRIO
app.post("/relatorio", async (req, res) => {
  try {
    const { user_id } = req.body;

    const plano = await getPlano(user_id);

    if (plano !== "premium") {
      return res.status(403).json({ erro: "Apenas premium" });
    }

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

  } catch (err) {
    console.error("Erro relatório:", err);
    res.status(500).json({ erro: "Erro relatório" });
  }
});

// 💳 CHECKOUT
app.post("/create-checkout", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ erro: "user_id obrigatório" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: "Premium NeuroMapa360" },
            unit_amount: 1990,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user_id,
      },
      success_url: "https://neuro360.vercel.app",
      cancel_url: "https://neuro360.vercel.app",
    });

    console.log("💳 Checkout criado para:", user_id);

    res.json({ url: session.url });

  } catch (err) {
    console.error("Erro checkout:", err);
    res.status(500).json({ erro: "Erro ao criar checkout" });
  }
});

// 🚀 PORTA
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server rodando na porta", PORT);
});
