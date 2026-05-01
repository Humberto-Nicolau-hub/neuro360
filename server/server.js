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
   🔓 CORS BLINDADO
========================= */
app.use(cors({
  origin: "*", // 🔥 libera qualquer origem (Vercel incluso)
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
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
const validarUsuario = async (user_id) => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("plano, is_admin, nivel")
      .eq("id", user_id)
      .maybeSingle();

    return data || { plano: "free", is_admin: false, nivel: 1 };
  } catch {
    return { plano: "free", is_admin: false, nivel: 1 };
  }
};

/* =========================
   🧠 PROMPT TERAPÊUTICO
========================= */
const gerarPromptTerapeutico = (texto, emocao, contexto) => {
  return `
Você é uma IA de acompanhamento emocional guiado baseada em PNL.

Seja extremamente empático, humano e acolhedor.

CONTEXTO:
${contexto || "Sem histórico anterior"}

USUÁRIO:
Estou me sentindo ${emocao}. ${texto}

Conduza como uma sessão terapêutica real e finalize com uma pergunta.
`;
};

/* =========================
   🤖 IA (VERSÃO CORRIGIDA)
========================= */
app.post("/ia", async (req, res) => {
  try {
    console.log("🔥 REQUISIÇÃO RECEBIDA:", req.body);

    const { texto, emocao, user_id, modo } = req.body;

    if (!texto || !emocao || !user_id) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const user = await validarUsuario(user_id);

    /* 🔒 CONTROLE FREE (SEM BLOQUEAR UX) */
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const hoje = new Date().toISOString().slice(0, 10);

    if (!user.is_admin && user.plano !== "premium") {
      try {
        const { data: usoIp } = await supabase
          .from("uso_ip_diario")
          .select("*")
          .eq("ip", ip)
          .eq("data", hoje)
          .maybeSingle();

        if (usoIp && usoIp.total >= 5) {
          console.log("🚫 LIMITE FREE ATINGIDO");

          // 🔥 NÃO BLOQUEIA MAIS COM 403
          return res.json({
            resposta:
              "Você já utilizou suas interações gratuitas hoje. Quer continuar sua evolução desbloqueando o Premium?",
            limite: true
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
      } catch {
        console.log("⚠️ erro controle free ignorado");
      }
    }

    /* 🧠 MEMÓRIA */
    let contexto = "";

    try {
      const { data } = await supabase
        .from("memoria_ia")
        .select("emocao, texto")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(5);

      contexto =
        data?.map((m) => `${m.emocao}: ${m.texto}`).join("\n") || "";
    } catch {}

    /* 🧠 MENSAGENS */
    const messages =
      modo === "terapia"
        ? [
            {
              role: "system",
              content: gerarPromptTerapeutico(texto, emocao, contexto),
            },
          ]
        : [
            {
              role: "system",
              content: `Seja acolhedor.\n${contexto}`,
            },
            {
              role: "user",
              content: `Estou me sentindo ${emocao}. ${texto}`,
            },
          ];

    /* 🤖 OPENAI */
    let resposta = "Estou aqui com você. Pode me contar mais.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });

      resposta =
        completion?.choices?.[0]?.message?.content || resposta;
    } catch (err) {
      console.log("⚠️ erro OpenAI:", err.message);
    }

    /* 💾 SALVAR MEMÓRIA */
    try {
      await supabase.from("memoria_ia").insert([
        { user_id, emocao, texto, resposta },
      ]);
    } catch {}

    return res.json({ resposta });

  } catch (err) {
    console.error("❌ ERRO GERAL:", err);
    return res.status(500).json({
      resposta: "Tive um pequeno erro, mas continuo aqui com você.",
    });
  }
});

/* =========================
   🚀 SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
