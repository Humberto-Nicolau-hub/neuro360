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

// 🔥 CONTROLE DE SUPORTE (ADMIN)
const SUPORTE_ATIVO = process.env.SUPORTE_ATIVO !== "false";
const SUPORTE_NUMERO = "5561993338458";

/* ================= FUNÇÕES AUXILIARES ================= */

// 🔥 Detecta encerramento
function detectarEncerramento(texto) {
  const t = texto.toLowerCase();
  return ["obrigado", "valeu", "tchau", "até mais"].some(p => t.includes(p));
}

// 🔥 Detecta dor emocional
function detectarDor(texto) {
  const t = texto.toLowerCase();
  return [
    "não aguento",
    "não consigo",
    "cansado",
    "perdido",
    "ansiedade",
    "depress",
    "triste",
    "sozinho",
    "sem sentido"
  ].some(p => t.includes(p));
}

// 🔥 Data segura (corrige bug do dia virar)
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

    if (!texto) return res.json({ resposta: "Fale comigo..." });
    if (!user_id) user_id = "anon";

    /* ===== ENCERRAMENTO INTELIGENTE ===== */
    if (detectarEncerramento(texto)) {
      return res.json({
        resposta: "Foi um prazer te ouvir. Estarei aqui sempre que precisar. 🌱",
        encerrado: true
      });
    }

    /* ===== PLANO ===== */
    let isPremium = false;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("plano")
        .eq("id", user_id)
        .single();

      if (data?.plano === "premium") isPremium = true;
    } catch {}

    /* ===== LIMITE FREE (RESET CORRIGIDO) ===== */
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

    /* ===== MEMÓRIA ===== */
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

    /* ===== HISTÓRICO ===== */
    let historicoTexto = historico
      ?.map(m => `${m.tipo === "user" ? "Usuário" : "IA"}: ${m.texto}`)
      .join("\n") || "";

    /* ===== PROMPT ===== */

    let promptSistema = "";

    if (modoProfundo && isPremium) {
      promptSistema = `
Você é terapeuta especialista em PNL.

1. Valide
2. Identifique padrão
3. Nomeie
4. Pergunte
5. Técnica prática

Memória:
${memoriaTexto}

Histórico:
${historicoTexto}
`;
    } else if (modo === "terapeutico") {
      promptSistema = `
Você é terapeuta com base em PNL.

- Empatia real
- Clareza
- Pergunta estratégica

Memória:
${memoriaTexto}

Histórico:
${historicoTexto}
`;
    } else {
      promptSistema = "Responda de forma clara.";
    }

    /* ===== OPENAI ===== */

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: promptSistema },
        { role: "user", content: `${emocao}: ${texto}` }
      ],
    });

    let resposta =
      completion?.choices?.[0]?.message?.content ||
      "Estou aqui com você.";

    /* ===== FUNIL INVISÍVEL ===== */

    if (!isPremium && detectarDor(texto) && modo === "terapeutico") {
      resposta += `

🧠 Existe um padrão emocional por trás disso.

Eu posso te guiar de forma mais profunda nesse processo.

Se quiser, posso te acompanhar passo a passo.`;
    }

    /* ===== SUPORTE ===== */

    if (SUPORTE_ATIVO && detectarDor(texto)) {
      resposta += `

📞 Se quiser falar com alguém humano:
https://wa.me/${SUPORTE_NUMERO}`;
    }

    /* ===== SALVAR ===== */

    await supabase.from("memoria_ia").insert({ user_id, texto });
    await supabase.from("registros_emocionais").insert({ user_id, emocao, texto });

    res.json({ resposta });

  } catch (err) {
    console.error(err);
    res.json({ resposta: "Tive um pequeno erro, mas continuo com você." });
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

app.listen(process.env.PORT || 10000, () => {
  console.log("🚀 Server rodando");
});
