import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* ================= CORS ================= */
app.use(cors({
  origin: (origin, callback) => callback(null, true)
}));

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
  if (!texto || typeof texto !== "string" || texto.length > 500) return false;
  return true;
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

/* ================= IA ================= */
app.post("/ia", async (req, res) => {
  try {
    let { texto, emocao, user_id, historico, modo, modoProfundo } = req.body;

    if (!validarEntrada(texto)) {
      return res.json({ resposta: "Me diga isso de forma um pouco mais simples pra eu te ajudar melhor." });
    }

    user_id = user_id || "anon";

    if (!checkRateLimit(user_id)) {
      return res.json({
        resposta: "Você está enviando muitas mensagens rapidamente. Respira um pouco e vamos continuar. 🌿"
      });
    }

    if (detectarEncerramento(texto)) {
      return res.json({
        resposta: "Foi um prazer te ouvir. Estarei aqui sempre que precisar. 🌱",
        encerrado: true
      });
    }

    let isPremium = false;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("plano")
        .eq("id", user_id)
        .single();

      if (data?.plano === "premium") isPremium = true;
    } catch {}

    if (!isPremium) {
      const hoje = getHoje();

      const { count } = await supabase
        .from("registros_emocionais")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id)
        .gte("created_at", `${hoje}T00:00:00`)
        .lte("created_at", `${hoje}T23:59:59`);

      if ((count || 0) >= 3) {
        return res.json({
          resposta: "Você atingiu o limite do plano free hoje 🚀",
          limite: true
        });
      }
    }

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

    let historicoTexto = historico
      ?.map(m => `${m.tipo === "user" ? "Usuário" : "IA"}: ${m.texto}`)
      .join("\n") || "";

    let promptSistema = "";

    if (modoProfundo && isPremium) {
      promptSistema = `Você é terapeuta especialista em PNL.\n\nMemória:\n${memoriaTexto}\n\nHistórico:\n${historicoTexto}`;
    } else if (modo === "terapeutico") {
      promptSistema = `Você é terapeuta com base em PNL.\n\nMemória:\n${memoriaTexto}\n\nHistórico:\n${historicoTexto}`;
    } else {
      promptSistema = "Responda de forma clara.";
    }

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
    } catch {
      resposta = "Tive uma pequena instabilidade, mas continuo com você.";
    }

    const fase = detectarFase(texto);

    if (fase === "dor") resposta += "\n\n💭 O que mais pesa nisso pra você agora?";
    if (fase === "clareza") resposta += "\n\n✨ Você já começou a organizar isso.";
    if (fase === "ação") resposta += "\n\n🚀 Qual o menor passo hoje?";
    if (fase === "fechamento") {
      resposta = `Fico feliz em caminhar com você. 🌱\n\n👉 Qual foi seu principal insight?`;
    }

    if (SUPORTE_ATIVO && detectarDor(texto)) {
      resposta += `\n\n📞 https://wa.me/${SUPORTE_NUMERO}`;
    }

    await supabase.from("memoria_ia").insert({ user_id, texto });
    await supabase.from("registros_emocionais").insert({ user_id, emocao, texto });

    res.json({ resposta });

  } catch (err) {
    console.error(err);
    res.json({ resposta: "Erro interno, mas continuo com você." });
  }
});

/* ================= STRIPE ================= */
app.post("/criar-checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: process.env.FRONTEND_URL,
    cancel_url: process.env.FRONTEND_URL,
  });

  res.json({ url: session.url });
});

/* ================= ADMIN ================= */
app.get("/admin-metricas", async (req, res) => {
  const { count: usuarios } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: registros } = await supabase.from("registros_emocionais").select("*", { count: "exact", head: true });
  const { count: ia } = await supabase.from("memoria_ia").select("*", { count: "exact", head: true });

  res.json({ usuarios, registros, ia });
});

/* ================= START ================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
