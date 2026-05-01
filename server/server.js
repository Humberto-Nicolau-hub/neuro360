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
          console.log("💰 Pagamento confirmado:", user_id);

          await supabase
            .from("profiles")
            .update({ plano: "premium" })
            .eq("id", user_id);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook erro:", err.message);
      res.status(400).send(`Webhook Error`);
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

    if (!user_id || !email) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      metadata: { user_id },
      success_url: `${process.env.FRONTEND_URL}?sucesso=true`,
      cancel_url: `${process.env.FRONTEND_URL}?cancelado=true`,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ Erro checkout:", err.message);
    res.status(500).json({ error: "Erro checkout" });
  }
});

/* =========================
   🧠 PROMPT TERAPÊUTICO
========================= */
const gerarPromptTerapeutico = (texto, emocao, contexto) => {
  return `
Você é uma IA de acompanhamento emocional guiado baseada em PNL.

Seu papel é conduzir o usuário com empatia, profundidade e presença.

REGRAS:
- Fale como um humano acolhedor
- Valide o sentimento
- Faça perguntas que levem à reflexão
- Ajude a reorganizar o pensamento
- Nunca seja robótico
- Sempre finalize com uma pergunta

CONTEXTO:
${contexto}

SITUAÇÃO:
Estou me sentindo ${emocao}. ${texto}

Conduza como uma sessão terapêutica.
`;
};

/* =========================
   🤖 IA
========================= */
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    if (!texto || !emocao || !user_id) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const user = await validarUsuario(user_id);

    return executarIA(user, texto, emocao, user_id, req, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro IA" });
  }
});

/* =========================
   🧠 IA EVOLUTIVA + TERAPIA
========================= */
const executarIA = async (user, texto, emocao, user_id, req, res) => {
  try {

    const modo = req.body.modo || "normal";

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const hoje = new Date().toISOString().slice(0, 10);

    /* 🔒 LIMITE FREE */
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

    /* 🧠 MEMÓRIA */
    const { data: memoria } = await supabase
      .from("memoria_ia")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const contexto = memoria?.map(m => `${m.emocao}: ${m.texto}`).join("\n") || "";

    let messages;

    if (modo === "terapia") {
      messages = [
        {
          role: "system",
          content: gerarPromptTerapeutico(texto, emocao, contexto)
        }
      ];
    } else {
      let estilo = "Seja acolhedor";
      if (user.nivel >= 2) estilo = "Seja profundo e reflexivo";
      if (user.nivel >= 3) estilo = "Seja estratégico e transformador";

      messages = [
        { role: "system", content: `${estilo}\n${contexto}` },
        { role: "user", content: `Estou me sentindo ${emocao}. ${texto}` }
      ];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages
    });

    const resposta = completion.choices[0].message.content;

    await supabase.from("memoria_ia").insert([
      { user_id, emocao, texto, resposta }
    ]);

    return res.json({ resposta });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro IA interna" });
  }
};

/* =========================
   📊 ADMIN
========================= */
app.get("/admin-metricas", async (req, res) => {
  try {

    const { count: totalUsuarios } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalRegistros } = await supabase
      .from("registros_emocionais")
      .select("*", { count: "exact", head: true });

    const { count: totalIA } = await supabase
      .from("memoria_ia")
      .select("*", { count: "exact", head: true });

    res.json({
      totalUsuarios: totalUsuarios || 0,
      totalRegistros: totalRegistros || 0,
      totalIA: totalIA || 0
    });

  } catch (err) {
    console.error(err);
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
