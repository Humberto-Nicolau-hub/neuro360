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
   🔓 CORS + JSON
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
          quantity: 1,
        },
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

Seja empático, humano e profundo.

CONTEXTO:
${contexto || "Sem histórico anterior"}

USUÁRIO:
Estou me sentindo ${emocao}. ${texto}

Conduza como uma sessão terapêutica e finalize com uma pergunta.
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

    /* 🔒 CONTROLE FREE */
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
          return res.status(403).json({
            error: "Limite atingido",
            bloquear: true,
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
      } catch (err) {
        console.log("⚠️ erro controle free (ignorado)");
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
    } catch {
      contexto = "";
    }

    /* 🧠 MENSAGENS */
    let messages;

    if (modo === "terapia") {
      messages = [
        {
          role: "system",
          content: gerarPromptTerapeutico(texto, emocao, contexto),
        },
      ];
    } else {
      messages = [
        {
          role: "system",
          content: `Seja acolhedor.\n${contexto}`,
        },
        {
          role: "user",
          content: `Estou me sentindo ${emocao}. ${texto}`,
        },
      ];
    }

    /* 🤖 OPENAI */
    let resposta = "Estou aqui com você. Quer me contar mais?";

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });

      resposta =
        completion?.choices?.[0]?.message?.content || resposta;
    } catch (err) {
      console.log("⚠️ erro IA fallback ativado");
    }

    /* 💾 SALVAR MEMÓRIA */
    try {
      await supabase.from("memoria_ia").insert([
        { user_id, emocao, texto, resposta },
      ]);
    } catch {
      console.log("⚠️ erro salvar memória (ignorado)");
    }

    return res.json({ resposta });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      resposta: "Tive um pequeno erro, mas estou aqui com você.",
    });
  }
});

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
      totalIA: totalIA || 0,
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
