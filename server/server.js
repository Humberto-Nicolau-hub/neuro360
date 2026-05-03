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
  origin: (origin, callback) => {
    return callback(null, true);
  }
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

/* ================= IA ================= */

app.post("/ia", async (req, res) => {
  try {
    let { texto, emocao, user_id, historico, modo, modoProfundo } = req.body;

    if (!texto) return res.json({ resposta: "Fale comigo..." });
    if (!user_id) user_id = "anon";

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

    /* ===== LIMITE FREE ===== */
    if (!isPremium) {
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

    /* ================= PROMPT ================= */

    let promptSistema = "";

    /* 🔥 MODO TERAPIA GUIADA INTELIGENTE */
    if (modoProfundo && isPremium) {
      promptSistema = `
Você é um terapeuta especialista em:
- PNL (Programação Neurolinguística)
- Terapia Neuro Sistêmica

Você NÃO é um chatbot.
Você conduz uma sessão terapêutica real.

Siga EXATAMENTE este fluxo:

1. Valide profundamente a emoção do usuário
2. Identifique o padrão emocional oculto
3. Nomeie o padrão (ex: autossabotagem, ansiedade antecipatória, rejeição)
4. Conduza com 1 pergunta estratégica
5. Aplique uma técnica prática de PNL
6. Gere um micro exercício aplicável agora

REGRAS:
- Seja humano e empático
- Evite respostas genéricas
- Use linguagem emocional e estratégica
- Sempre conduza (não apenas responda)
- Máximo 12 linhas

Memória:
${memoriaTexto}

Histórico:
${historicoTexto}
`;
    }

    /* 🔥 MODO TERAPÊUTICO PADRÃO */
    else if (modo === "terapeutico") {
      promptSistema = `
Você é um terapeuta especialista em:
- PNL
- Terapia Neuro Sistêmica

Responda com:
- Empatia real
- Perguntas inteligentes
- Direcionamento leve

Evite respostas genéricas.

Memória:
${memoriaTexto}

Histórico:
${historicoTexto}
`;
    }

    /* 🔥 MODO NORMAL */
    else {
      promptSistema = "Responda de forma clara, objetiva e útil.";
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

    /* 🔥 GATILHO DE CONVERSÃO INTELIGENTE */
    if (!isPremium && modo === "terapeutico") {
      resposta += `

💡 Existe um nível mais profundo de acompanhamento que ajuda você a sair desse padrão emocional com mais rapidez.

Se fizer sentido para você, posso te guiar nisso.`;
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
