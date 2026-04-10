import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import Stripe from "stripe";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🔐 VALIDAÇÃO DE AMBIENTE
========================= */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERRO: SUPABASE não configurado");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI não configurada (modo teste ativo)");
}

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️ Stripe não configurado (modo sem pagamento)");
}

/* =========================
   🚀 CLIENTES
========================= */

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY)
  : null;

/* =========================
   🧠 ROTA IA (MODO TESTE)
========================= */

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    console.log("📩 BODY RECEBIDO:", req.body);

    // 🔥 VALIDAÇÃO
    if (!texto || !texto.trim()) {
      return res.status(400).json({
        erro: "Texto é obrigatório",
      });
    }

    if (!emocao) {
      return res.status(400).json({
        erro: "Emoção é obrigatória",
      });
    }

    if (!user_id) {
      console.error("❌ user_id não enviado");
      return res.status(400).json({
        erro: "user_id é obrigatório",
      });
    }

    // 🧪 RESPOSTA MOCK (SEM OPENAI)
    const resposta = "Resposta teste funcionando 🚀";

    console.log("🧪 USANDO MODO TESTE (SEM OPENAI)");

    // 💾 SALVAR NO BANCO
    const { data, error } = await supabase
      .from("registros")
      .insert([
        {
          user_id,
          emocao,
          texto,
          resposta,
        },
      ])
      .select();

    if (error) {
      console.error("❌ ERRO SUPABASE:", error);
      return res.status(500).json({
        erro: "Erro ao salvar no banco",
        detalhes: error.message,
      });
    }

    console.log("✅ SALVO NO BANCO:", data);

    return res.json({ resposta });

  } catch (error) {
    console.error("🔥 ERRO GERAL:", error);
    return res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
});

/* =========================
   💰 STRIPE (OPCIONAL)
========================= */

app.post("/create-checkout", async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ erro: "Stripe não configurado" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: "SEU_PRICE_ID_AQUI",
          quantity: 1,
        },
      ],
      success_url: "https://neuro360-syc6.vercel.app",
      cancel_url: "https://neuro360-syc6.vercel.app",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("❌ ERRO STRIPE:", err);
    res.status(500).json({ erro: "Erro pagamento" });
  }
});

/* =========================
   🚀 START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server rodando na porta", PORT);
});
