import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= CONFIG ================= */
const SUPORTE_NUMERO = "5561993338458";

/* ================= RATE LIMIT ================= */
const rateLimitMap = new Map();

function checkRateLimit(user_id) {
  const now = Date.now();
  const windowTime = 60000;
  const maxRequests = 10;

  if (!rateLimitMap.has(user_id)) {
    rateLimitMap.set(user_id, []);
  }

  const timestamps = rateLimitMap.get(user_id).filter(t => now - t < windowTime);

  if (timestamps.length >= maxRequests) return false;

  timestamps.push(now);
  rateLimitMap.set(user_id, timestamps);

  return true;
}

/* ================= HELPERS ================= */

function detectarFase(texto) {
  const t = texto.toLowerCase();

  if (/obrigado|valeu|tchau/.test(t)) return "fechamento";
  if (/ansiedade|triste|cansado|sozinho|não aguento/.test(t)) return "dor";
  if (/entendi|faz sentido/.test(t)) return "clareza";
  if (/vou tentar|vou fazer/.test(t)) return "ação";

  return "exploracao";
}

function gerarRecomendacao(emocao) {
  const mapa = {
    Ansioso: "Respire fundo por 2 minutos e foque no presente.",
    Triste: "Escreva 3 coisas que ainda fazem sentido pra você.",
    Desmotivado: "Faça apenas UMA pequena ação hoje.",
    Estressado: "Pare 5 minutos e relaxe seu corpo.",
    Deprimido: "Você não precisa resolver tudo hoje. Apenas continue.",
  };

  return mapa[emocao] || "Observe seus pensamentos sem julgamento.";
}

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/ia", (req, res) => {
  res.json({ status: "ok", msg: "Use POST" });
});

/* ================= IA ================= */
app.post("/ia", async (req, res) => {
  try {
    let { texto, emocao, user_id, contexto, modo, modoProfundo } = req.body;

    if (!texto) {
      return res.json({ resposta: "Me diga um pouco mais." });
    }

    if (!checkRateLimit(user_id)) {
      return res.json({
        resposta: "Respira um pouco 🌿 e vamos com calma."
      });
    }

    /* ================= CONTEXTO ================= */
    const contextoFormatado = (contexto || [])
      .map(c => `Usuário: ${c.texto} | IA: ${c.resposta}`)
      .join("\n");

    /* ================= PROMPT INTELIGENTE ================= */
    const promptSistema = `
Você é um especialista em PNL, inteligência emocional e terapia comportamental.

Seu papel:
- Acolher emocionalmente
- Gerar clareza
- Guiar para ação leve
- Adaptar resposta ao estado emocional

Modo: ${modo}
Profundo: ${modoProfundo}

Contexto recente:
${contextoFormatado}
`;

    /* ================= OPENAI ================= */
    let resposta = "Estou aqui com você.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: promptSistema },
          { role: "user", content: `${emocao}: ${texto}` }
        ],
      });

      resposta = completion?.choices?.[0]?.message?.content || resposta;

    } catch (e) {
      console.log("Erro OpenAI:", e.message);
      resposta = "Tive uma instabilidade, mas continuo com você.";
    }

    /* ================= INTELIGÊNCIA EXTRA ================= */
    const fase = detectarFase(texto);

    if (fase === "dor") {
      resposta += "\n\n💭 Me conta mais sobre isso.";
    }

    if (fase === "ação") {
      resposta += "\n\n🚀 Qual o próximo pequeno passo?";
    }

    /* ================= RECOMENDAÇÃO ================= */
    const recomendacao = gerarRecomendacao(emocao);

    resposta += `\n\n🧭 Sugestão: ${recomendacao}`;

    /* ================= SUPORTE ================= */
    if (/não aguento|sozinho/.test(texto.toLowerCase())) {
      resposta += `\n\n📞 https://wa.me/${SUPORTE_NUMERO}`;
    }

    /* ================= SALVAR ================= */
    try {
      await supabase.from("memoria_ia").insert({
        user_id,
        texto,
        emocao,
        resposta
      });

      await supabase.from("registros_emocionais").insert({
        user_id,
        emocao,
        texto
      });

    } catch (e) {
      console.log("Erro salvar:", e.message);
    }

    res.json({ resposta });

  } catch (err) {
    console.error("ERRO GERAL:", err);
    res.status(500).json({ resposta: "Erro interno." });
  }
});

/* ================= ADMIN ================= */
app.get("/admin-metricas", async (req, res) => {
  try {
    const { count: usuarios } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: registros } = await supabase.from("registros_emocionais").select("*", { count: "exact", head: true });
    const { count: ia } = await supabase.from("memoria_ia").select("*", { count: "exact", head: true });

    res.json({ usuarios, registros, ia });

  } catch (err) {
    res.status(500).json({ error: "Erro métricas" });
  }
});

/* ================= STRIPE ================= */
app.post("/criar-checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: process.env.FRONTEND_URL,
      cancel_url: process.env.FRONTEND_URL,
    });

    res.json({ url: session.url });

  } catch {
    res.status(500).json({ error: "Erro checkout" });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
