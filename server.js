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
  console.error("❌ ERRO: OPENAI_API_KEY não configurada");
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️ Stripe não configurado (modo sem pagamento)");
}

/* =========================
   🚀 CLIENTES
========================= */

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY)
  : null;

/* =========================
   🧠 ROTA IA TERAPÊUTICA
========================= */

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    console.log("📩 RECEBIDO:", { texto, emocao, user_id });

    if (!texto) {
      return res.status(400).json({ erro: "Texto vazio" });
    }

    if (!user_id) {
      console.error("❌ user_id não enviado");
      return res.status(400).json({ erro: "user_id é obrigatório" });
    }

    // 🧠 PROMPT TERAPÊUTICO
    const prompt = `
Você é um terapeuta especialista em Programação Neurolinguística (PNL).

Objetivo:
Ajudar o usuário a sair de estados como ansiedade, depressão, medo ou crenças limitantes.

Estado atual do usuário: ${emocao}
Relato: ${texto}

Responda de forma:
- Empática
- Profunda
- Estratégica
- Com técnicas práticas de PNL

Inclua:
- Reframe mental
- Perguntas poderosas
- Pequena ação prática

Nunca dê respostas genéricas.
`;

    // 🔥 CHAMADA IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const resposta = completion.choices[0].message.content;

    // 💾 SALVAR NO BANCO
    const { error } = await supabase
      .from("registros")
      .insert([
        {
          user_id: user_id,
          emocao,
          texto,
          resposta,
        },
      ]);

    if (error) {
      console.error("❌ ERRO AO SALVAR NO BANCO:", error);
      return res.status(400).json({ erro: error.message });
    }

    console.log("✅ SALVO NO BANCO COM SUCESSO");

    return res.json({ resposta });

  } catch (error) {
    console.error("🔥 ERRO IA:", error);
    return res.status(500).json({ erro: "Erro IA" });
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
    console.error(err);
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
