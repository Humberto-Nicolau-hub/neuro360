import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ================= CORS ================= */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ================= CLIENTES ================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= CONFIG ================= */
const SUPORTE_ATIVO = process.env.SUPORTE_ATIVO !== "false";
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

/* ================= FUNÇÕES ================= */
function validarEntrada(texto) {
  return texto && typeof texto === "string" && texto.length <= 500;
}

function detectarEncerramento(texto) {
  const t = texto.toLowerCase();
  return ["obrigado", "valeu", "tchau", "até mais"].some(p => t.includes(p));
}

function detectarDor(texto) {
  const t = texto.toLowerCase();
  return [
    "não aguento","não consigo","cansado","perdido",
    "ansiedade","depress","triste","sozinho","sem sentido"
  ].some(p => t.includes(p));
}

function detectarFase(texto) {
  const t = texto.toLowerCase();

  if (detectarEncerramento(texto)) return "fechamento";
  if (/não aguento|ansiedade|triste|cansado|sozinho/.test(t)) return "dor";
  if (/entendi|faz sentido/.test(t)) return "clareza";
  if (/vou tentar|vou fazer/.test(t)) return "ação";

  return "exploracao";
}

function getHoje() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
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

    if (!validarEntrada(texto)) {
      return res.json({ resposta: "Me diga isso de forma mais simples pra eu te ajudar melhor." });
    }

    user_id = user_id || "anon";

    if (!checkRateLimit(user_id)) {
      return res.json({
        resposta: "Você está enviando muitas mensagens rapidamente. Respira um pouco 🌿"
      });
    }

    if (detectarEncerramento(texto)) {
      return res.json({
        resposta: "Foi um prazer te ouvir. Estarei aqui sempre que precisar 🌱",
        encerrado: true
      });
    }

    let resposta = "Estou aqui com você.";

    /* ================= IA ================= */
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um terapeuta com PNL, empático e prático." },
          { role: "user", content: `${emocao}: ${texto}` }
        ],
      });

      resposta = completion?.choices?.[0]?.message?.content || resposta;

    } catch (e) {
      console.log("Erro OpenAI:", e.message);
      resposta = "Tive uma instabilidade, mas continuo com você.";
    }

    const fase = detectarFase(texto);

    if (fase === "dor") resposta += "\n\n💭 O que mais pesa nisso?";
    if (fase === "ação") resposta += "\n\n🚀 Qual o menor passo agora?";

    if (SUPORTE_ATIVO && detectarDor(texto)) {
      resposta += `\n\n📞 https://wa.me/${SUPORTE_NUMERO}`;
    }

    /* ================= SALVAR (CORRIGIDO CIRÚRGICO) ================= */
    try {
      await supabase.from("memoria_ia").insert([
        {
          user_id,
          texto,
          emocao,
          resposta
        }
      ]);
    } catch (e) {
      console.log("Erro memoria_ia:", e.message);
    }

    try {
      await supabase.from("registros_emocionais").insert([
        {
          user_id,
          emocao,
          texto
        }
      ]);
    } catch (e) {
      console.log("Erro registros:", e.message);
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

  } catch {
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
