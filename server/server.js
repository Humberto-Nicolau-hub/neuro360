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
   ⚠️ WEBHOOK
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
      res.status(400).send(`Webhook Error`);
    }
  }
);

/* =========================
   🔓 CORS
========================= */
app.use(cors({
  origin: true,
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
   🔐 VALIDAR USUÁRIO
========================= */
const validarUsuarioPremium = async (user_id) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("plano, is_admin")
      .eq("id", user_id);

    if (!data || data.length === 0) return null;
    return data[0];

  } catch {
    return null;
  }
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

  } catch {
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
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const user = await validarUsuarioPremium(user_id);
    const userFinal = user || { plano: "free", is_admin: false };

    return executarIA(userFinal, texto, emocao, user_id, req, res);

  } catch {
    res.status(500).json({ error: "Erro IA" });
  }
});

/* =========================
   🤖 EXECUTAR IA (COM ANTI-FRAUDE)
========================= */
const executarIA = async (user, texto, emocao, user_id, req, res) => {
  try {

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const hoje = new Date().toISOString().slice(0, 10);

    if (!user.is_admin && user.plano !== "premium") {
      const { data: usoIp } = await supabase
        .from("uso_ip_diario")
        .select("*")
        .eq("ip", ip)
        .eq("data", hoje)
        .maybeSingle();

      if (usoIp && usoIp.total >= 5) {
        return res.status(403).json({
          error: "Limite por IP atingido",
          bloquear: true
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

    const { data: historico } = await supabase
      .from("registros_emocionais")
      .select("emocao")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    let contexto = "";
    if (historico?.length) {
      contexto = historico.map(h => h.emocao).join(", ");
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é especialista em inteligência emocional. Histórico: ${contexto}`,
        },
        {
          role: "user",
          content: `Estou me sentindo ${emocao}. ${texto}`,
        },
      ],
    });

    await supabase.from("registros_emocionais").insert([
      { user_id, emocao, texto, created_at: new Date() }
    ]);

    return res.json({
      resposta: completion.choices[0].message.content,
    });

  } catch {
    return res.status(500).json({ error: "Erro IA interna" });
  }
};

/* =========================
   📊 ADMIN METRICS (NOVO)
========================= */
app.get("/admin-metrics", async (req, res) => {
  try {

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: premiumUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("plano", "premium");

    const { count: freeUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("plano", "free");

    const hoje = new Date().toISOString().slice(0, 10);

    const { data: usoHoje } = await supabase
      .from("uso_ip_diario")
      .select("total")
      .eq("data", hoje);

    const totalUsoHoje = usoHoje
      ? usoHoje.reduce((acc, cur) => acc + cur.total, 0)
      : 0;

    const { count: totalInteracoes } = await supabase
      .from("registros_emocionais")
      .select("*", { count: "exact", head: true });

    res.json({
      totalUsers: totalUsers || 0,
      premiumUsers: premiumUsers || 0,
      freeUsers: freeUsers || 0,
      totalUsoHoje,
      totalInteracoes: totalInteracoes || 0,
    });

  } catch (err) {
    res.status(500).json({ error: "Erro métricas" });
  }
});

/* =========================
   🚀 SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
