import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ================= CORS (CORRIGIDO PRODUÇÃO) ================= */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://neuro360.vercel.app",
  "https://neuro360-zzx3-3ooxanxvg-humberto-nicolau-hubs-projects.vercel.app"
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // permite postman/local
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS bloqueado"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

/* ================= VALIDAÇÃO ================= */

if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL não definida");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY não definida");
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não definida");
if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY não definida");

/* ================= CLIENTES ================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

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
    } catch (err) {
      console.log("Erro ao verificar plano:", err.message);
    }

    /* 🔥 LIMITE FREE */
    if (!isPremium) {
      try {
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
      } catch (err) {
        console.log("Erro limite free:", err.message);
      }
    }

    /* 🔥 MEMÓRIA */
    let memoriaTexto = "";

    try {
      const { data } = await supabase
        .from("memoria_ia")
        .select("texto")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      memoriaTexto = data?.map(m => m.texto).join("\n") || "";
    } catch {}

    /* 🔥 HISTÓRICO */
    let historicoTexto = "";

    try {
      historicoTexto = historico
        ?.map(m => `${m.tipo === "user" ? "Usuário" : "IA"}: ${m.texto}`)
        .join("\n") || "";
    } catch {}

    /* 🔥 PROMPT */
    const promptSistema = `
Você é uma IA terapêutica empática.

- Seja humano
- Seja acolhedor
- Faça perguntas inteligentes
- Use memória e histórico

Memória:
${memoriaTexto}

Histórico:
${historicoTexto}
`;

    /* 🔥 OPENAI */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: promptSistema },
        { role: "user", content: `${emocao || "neutro"}: ${texto}` }
      ],
    });

    const resposta =
      completion?.choices?.[0]?.message?.content ||
      "Estou aqui com você.";

    /* 🔥 SALVAR */
    try {
      await supabase.from("memoria_ia").insert({ user_id, texto });
    } catch {}

    try {
      await supabase.from("registros_emocionais").insert({ user_id, emocao, texto });
    } catch {}

    return res.json({ resposta });

  } catch (err) {
    console.error("ERRO IA:", err);
    return res.json({ resposta: "Erro, mas continuo com você." });
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
    console.error("Erro Stripe:", err);
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
    console.error("Erro webhook:", err.message);
    return res.status(400).send(`Webhook error`);
  }

  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object;
      const email = session.customer_details.email;

      await supabase
        .from("profiles")
        .update({ plano: "premium" })
        .eq("email", email);

    } catch (err) {
      console.error("Erro atualizar plano:", err.message);
    }
  }

  res.json({ received: true });
});

/* ================= ADMIN ================= */

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
    console.error("Erro admin:", err);
    res.json({ usuarios: 0, registros: 0, ia: 0 });
  }
});

/* ================= FALLBACK ================= */

app.use((err, req, res, next) => {
  console.error("Erro global:", err.stack);
  res.status(500).json({ error: "Erro interno" });
});

/* ================= START ================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
