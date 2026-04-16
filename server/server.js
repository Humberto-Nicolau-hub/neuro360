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

// ⚠️ IMPORTANTE (Stripe webhook precisa vir antes do JSON)
app.use("/webhook-stripe", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

// 🔍 LOG GLOBAL (DEBUG)
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

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

// 🧠 SCORE
const mapaScore = {
  Feliz: 3,
  Ansioso: 1,
  Triste: 0,
  Cansado: 1,
};

// 🔎 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("API Neuro360 rodando 🚀");
});

// 🔥 GET PLANO
async function getPlano(user_id) {
  try {
    if (!user_id) return "free";

    const { data, error } = await supabase
      .from("usuarios")
      .select("plano")
      .eq("id", user_id)
      .single();

    if (error) {
      console.error("Erro plano:", error);
      return "free";
    }

    return data?.plano || "free";
  } catch (err) {
    console.error("Erro getPlano:", err);
    return "free";
  }
}

// ==========================
// 🤖 IA
// ==========================
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body || {};

    if (!texto || !emocao) {
      return res.status(400).json({
        erro: "Texto e emoção são obrigatórios",
      });
    }

    const plano = await getPlano(user_id);

    // 🔒 LIMITADOR FREE
    if (plano !== "premium") {
      const hoje = new Date().toISOString().split("T")[0];

      const { count, error } = await supabase
        .from("registros")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id)
        .gte("created_at", hoje);

      if (error) {
        console.error("Erro contagem:", error);
      }

      if ((count || 0) >= 5) {
        return res.json({
          resposta: "🔒 Limite FREE atingido. Faça upgrade.",
          plano,
          bloqueado: true,
        });
      }
    }

    // 🤖 IA
    let resposta = "Não consegui gerar resposta.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: plano === "premium" ? 0.7 : 0.5,
        messages: [
          {
            role: "system",
            content:
              "Você é especialista em PNL, inteligência emocional e comportamento humano.",
          },
          {
            role: "user",
            content: `Emoção: ${emocao}\nTexto: ${texto}`,
          },
        ],
      });

      resposta =
        completion.choices?.[0]?.message?.content || resposta;

    } catch (err) {
      console.error("Erro OpenAI:", err);
    }

    // 📊 SCORE
    const score = mapaScore[emocao] ?? 1;

    try {
      await supabase.from("registros").insert([
        { user_id, emocao, texto, resposta, score, plano },
      ]);
    } catch (err) {
      console.error("Erro salvar registro:", err);
    }

    return res.json({ resposta, plano });

  } catch (err) {
    console.error("ERRO /ia:", err);
    return res.status(500).json({ erro: "Erro interno IA" });
  }
});

// ==========================
// 📊 DASHBOARD
// ==========================
app.post("/dashboard", async (req, res) => {
  try {
    const { user_id } = req.body || {};

    if (!user_id) {
      return res.status(400).json({ erro: "user_id obrigatório" });
    }

    const { data, error } = await supabase
      .from("registros")
      .select("emocao, score, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return res.status(500).json({ erro: "Erro dashboard" });
    }

    return res.json({ dados: data || [] });

  } catch (err) {
    console.error("ERRO /dashboard:", err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// ==========================
// 📊 RELATÓRIO
// ==========================
app.post("/relatorio", async (req, res) => {
  try {
    const { user_id } = req.body || {};

    const { data: registros } = await supabase
      .from("registros")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .limit(10);

    const resumo =
      registros?.map(r => `${r.emocao}: ${r.texto}`).join("\n") || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Analise emocional com PNL." },
        { role: "user", content: resumo },
      ],
    });

    return res.json({
      relatorio: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error("ERRO /relatorio:", err);
    res.status(500).json({ erro: "Erro relatório" });
  }
});

// ==========================
// 💳 STRIPE
// ==========================
app.post("/create-checkout", async (req, res) => {
  try {
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

  } catch (err) {
    console.error("Erro Stripe:", err);
    res.status(500).json({ erro: "Erro pagamento" });
  }
});

// ==========================
// 🔥 WEBHOOK
// ==========================
app.post("/webhook-stripe", async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      await supabase
        .from("usuarios")
        .update({ plano: "premium" })
        .eq("email", session.customer_details.email);
    }

    res.json({ received: true });

  } catch (err) {
    console.error("Erro webhook:", err);
    res.status(400).send("Webhook error");
  }
});

// ==========================
// 📅 CRON
// ==========================
cron.schedule("0 9 * * 1", async () => {
  console.log("📅 Relatório semanal");

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, email, plano");

  for (const user of usuarios || []) {
    try {
      const { data: registros } = await supabase
        .from("registros")
        .select("emocao, texto")
        .eq("user_id", user.id)
        .limit(10);

      if (!registros?.length) continue;

      const resumo = registros
        .map(r => `${r.emocao}: ${r.texto}`)
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Resumo emocional semanal." },
          { role: "user", content: resumo },
        ],
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "📊 Seu Relatório Semanal",
        text: completion.choices[0].message.content,
      });

    } catch (err) {
      console.error("Erro cron:", err);
    }
  }
});

// ==========================
// 🚀 START
// ==========================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
