import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";

dotenv.config();

const app = express();

/* =========================
   🔐 VALIDAÇÃO DE ENV (ANTI-CRASH)
========================= */
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ ERRO: Supabase ENV não definida");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY não definida");
}

/* =========================
   🔐 STRIPE CONFIG
========================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
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
   ⚠️ WEBHOOK
========================= */
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send("Webhook não configurado");
      }

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
        }
      }

      res.json({ received: true });

    } catch (err) {
      console.error("Webhook erro:", err.message);
      res.status(400).send("Erro webhook");
    }
  }
);

/* =========================
   🔓 CORS
========================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* =========================
   🤖 OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   🔐 VALIDAR USUÁRIO
========================= */
const validarUsuario = async (user_id) => {
  const { data } = await supabase
    .from("profiles")
    .select("plano, is_admin, nivel")
    .eq("id", user_id)
    .maybeSingle();

  return data || { plano: "free", is_admin: false, nivel: 1 };
};

/* =========================
   💳 CHECKOUT
========================= */
app.post("/create-checkout", async (req, res) => {
  try {
    const { user_id, email } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      metadata: { user_id },
      success_url: process.env.FRONTEND_URL,
      cancel_url: process.env.FRONTEND_URL,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("Erro checkout:", err.message);
    res.status(500).json({ error: "Erro checkout" });
  }
});

/* =========================
   🤖 IA
========================= */
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    if (!texto || !emocao || !user_id) {
      return res.status(400).json({ resposta: "Fale comigo..." });
    }

    const user = await validarUsuario(user_id);

    return executarIA(user, texto, emocao, user_id, req, res);

  } catch (err) {
    console.error("Erro IA rota:", err.message);
    res.status(500).json({ resposta: "Erro, mas continuo com você." });
  }
});

/* =========================
   🧠 IA EVOLUTIVA
========================= */
const executarIA = async (user, texto, emocao, user_id, req, res) => {
  try {

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const hoje = new Date().toISOString().slice(0, 10);

    /* 🔒 LIMITADOR */
    if (!user.is_admin && user.plano !== "premium") {
      const { data: usoIp } = await supabase
        .from("uso_ip_diario")
        .select("*")
        .eq("ip", ip)
        .eq("data", hoje)
        .maybeSingle();

      if (usoIp && usoIp.total >= 5) {
        return res.status(403).json({
          resposta: "Limite atingido hoje 🚀"
        });
      }

      if (usoIp) {
        await supabase
          .from("uso_ip_diario")
          .update({ total: usoIp.total + 1 })
          .eq("id", usoIp.id);
      } else {
        await supabase
          .from("uso_ip_diario")
          .insert([{ ip, data: hoje, total: 1 }]);
      }
    }

    /* 🧠 MEMÓRIA */
    const { data: memoria } = await supabase
      .from("memoria_ia")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const contexto = memoria?.map(m => `${m.emocao}: ${m.texto}`).join("\n") || "";

    /* 🎯 ESTILO */
    let estilo = "Seja acolhedor";
    if (user.nivel >= 2) estilo = "Seja profundo";
    if (user.nivel >= 3) estilo = "Seja transformador";

    let resposta = "Estou aqui com você.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `${estilo}. Histórico:\n${contexto}`,
          },
          {
            role: "user",
            content: `Estou me sentindo ${emocao}. ${texto}`,
          },
        ],
      });

      resposta = completion?.choices?.[0]?.message?.content || resposta;

    } catch (err) {
      console.error("Erro OpenAI:", err.message);
    }

    await supabase.from("memoria_ia").insert([
      { user_id, emocao, texto, resposta }
    ]);

    return res.json({ resposta });

  } catch (err) {
    console.error("Erro IA interna:", err.message);
    return res.json({ resposta: "Erro, mas continuo com você." });
  }
};

/* =========================
   📊 ADMIN
========================= */
app.get("/admin-metricas", async (req, res) => {
  try {

    const { count: usuarios } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: registros } = await supabase
      .from("registros_emocionais")
      .select("*", { count: "exact", head: true });

    const { count: ia } = await supabase
      .from("memoria_ia")
      .select("*", { count: "exact", head: true });

    res.json({
      usuarios: usuarios || 0,
      registros: registros || 0,
      ia: ia || 0
    });

  } catch (err) {
    console.error("Erro métricas:", err.message);
    res.json({ usuarios: 0, registros: 0, ia: 0 });
  }
});

/* =========================
   🚀 SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
