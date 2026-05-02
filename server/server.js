import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";

dotenv.config();

const app = express();

/* =========================
   🔐 CONFIG
========================= */
const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";

/* =========================
   🔐 STRIPE
========================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/* =========================
   🔗 SUPABASE
========================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   🔓 CORS
========================= */
app.use(cors({
  origin: "*",
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
   🔐 VALIDAR USUÁRIO (BLINDADO)
========================= */
const validarUsuario = async (user_id) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("plano, is_admin, nivel")
      .eq("id", user_id)
      .single();

    // 🔥 BUSCAR EMAIL REAL DO AUTH
    let email = null;

    try {
      const { data: userAuth } =
        await supabase.auth.admin.getUserById(user_id);

      email = userAuth?.user?.email;
    } catch (e) {
      console.log("⚠️ erro ao buscar email:", e.message);
    }

    const isAdminEmail = email === ADMIN_EMAIL;

    if (error || !data) {
      return {
        plano: isAdminEmail ? "premium" : "free",
        is_admin: isAdminEmail,
        nivel: 1,
      };
    }

    return {
      plano: isAdminEmail ? "premium" : data.plano,
      is_admin: isAdminEmail || data.is_admin,
      nivel: data.nivel || 1,
    };

  } catch (err) {
    console.log("❌ erro validarUsuario:", err.message);
    return { plano: "free", is_admin: false, nivel: 1 };
  }
};

/* =========================
   🧠 PROMPT
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
   🤖 IA
========================= */
app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id, modo } = req.body;

    if (!texto || !emocao || !user_id) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const user = await validarUsuario(user_id);

    const isAdmin = user.is_admin === true;
    const isPremium = user.plano === "premium";

    console.log("👤 STATUS:", { isAdmin, isPremium });

    /* 🔒 BLOQUEIO FREE (ADMIN IGNORA) */
    if (!isAdmin && !isPremium) {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress;

      const hoje = new Date().toISOString().slice(0, 10);

      const { data: usoIp } = await supabase
        .from("uso_ip_diario")
        .select("*")
        .eq("ip", ip)
        .eq("data", hoje)
        .maybeSingle();

      if (usoIp && usoIp.total >= 5) {
        return res.json({
          resposta:
            "Você já utilizou suas interações gratuitas hoje. Quer desbloquear o Premium?",
          limite: true,
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
    let contexto = "";

    const { data: memoria } = await supabase
      .from("memoria_ia")
      .select("emocao, texto")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(5);

    contexto =
      memoria?.map((m) => `${m.emocao}: ${m.texto}`).join("\n") || "";

    /* 🧠 MENSAGENS */
    const messages =
      modo === "terapia"
        ? [{ role: "system", content: gerarPromptTerapeutico(texto, emocao, contexto) }]
        : [
            { role: "system", content: `Seja acolhedor.\n${contexto}` },
            { role: "user", content: `Estou me sentindo ${emocao}. ${texto}` },
          ];

    /* 🤖 OPENAI */
    let resposta = "Estou aqui com você.";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });

      resposta =
        completion?.choices?.[0]?.message?.content || resposta;

    } catch (err) {
      console.log("❌ erro openai:", err.message);
    }

    /* 💾 SALVAR */
    await supabase.from("memoria_ia").insert([
      { user_id, emocao, texto, resposta },
    ]);

    return res.json({ resposta });

  } catch (err) {
    console.error("❌ ERRO:", err);
    return res.status(500).json({
      resposta: "Tive um pequeno erro, mas continuo aqui com você.",
    });
  }
});

/* =========================
   🚀 START
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
