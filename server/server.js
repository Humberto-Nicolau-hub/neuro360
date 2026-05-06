import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

/* =========================
   CONFIG
========================= */

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 10000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =========================
   RATE LIMIT
========================= */

const rateMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();

  if (!rateMap.has(userId)) {
    rateMap.set(userId, []);
  }

  const requests = rateMap
    .get(userId)
    .filter((t) => now - t < 60000);

  if (requests.length >= 15) {
    return false;
  }

  requests.push(now);
  rateMap.set(userId, requests);

  return true;
}

/* =========================
   HELPERS
========================= */

function detectarDor(texto = "") {
  const t = texto.toLowerCase();

  return [
    "ansiedade",
    "depress",
    "triste",
    "sozinho",
    "medo",
    "angustia",
    "cansado",
    "sem sentido",
    "não aguento",
  ].some((p) => t.includes(p));
}

function detectarFase(texto = "") {
  const t = texto.toLowerCase();

  if (/vou tentar|vou fazer|vou mudar/.test(t)) {
    return "acao";
  }

  if (/entendi|faz sentido|compreendi/.test(t)) {
    return "clareza";
  }

  if (detectarDor(texto)) {
    return "dor";
  }

  return "exploracao";
}

function gerarRecomendacao(emocao) {
  const mapa = {
    Ansioso:
      "Experimente respiração guiada por 2 minutos antes de dormir.",
    Triste:
      "Tente escrever 3 pequenas vitórias do seu dia.",
    Estressado:
      "Seu corpo pede desaceleração. Caminhada leve pode ajudar.",
    Desmotivado:
      "Comece apenas pelo menor passo possível.",
    Deprimido:
      "Busque conexão humana hoje. Não enfrente isso sozinho.",
    Feliz:
      "Excelente momento para reforçar hábitos positivos.",
  };

  return mapa[emocao] || "Continue cuidando da sua mente.";
}

/* =========================
   HEALTH
========================= */

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    servidor: "Neuro360 IA",
  });
});

app.get("/ia", (req, res) => {
  res.json({
    status: "ok",
    metodo: "POST",
  });
});

/* =========================
   IA
========================= */

app.post("/ia", async (req, res) => {
  try {
    const {
      texto,
      emocao,
      user_id,
      modo,
      modoProfundo,
    } = req.body;

    if (!texto || typeof texto !== "string") {
      return res.status(400).json({
        resposta: "Texto inválido.",
      });
    }

    const userId = user_id || "anon";

    if (!checkRateLimit(userId)) {
      return res.json({
        resposta:
          "Muitas mensagens seguidas. Respire um pouco 🌿",
      });
    }

    let memoriaResumo = "";

    /* =========================
       BUSCA MEMÓRIA
    ========================= */

    try {
      const { data } = await supabase
        .from("memoria_ia")
        .select("texto, resposta, emocao")
        .eq("user_id", userId)
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      if (data?.length) {
        memoriaResumo = data
          .map(
            (m) =>
              `Usuário: ${m.texto}\nIA:${m.resposta}`
          )
          .join("\n");
      }
    } catch (e) {
      console.log("Memória:", e.message);
    }

    /* =========================
       SYSTEM PROMPT
    ========================= */

    const systemPrompt = `
Você é a Neuro360 IA.

Especialista em:
- PNL
- inteligência emocional
- neurociência
- terapia conversacional
- apoio emocional

REGRAS:
- Seja humano
- Respostas naturais
- Nunca muito longas
- Ajude emocionalmente
- Crie sensação de evolução
- Faça o usuário se sentir compreendido

Modo atual: ${modo}

Terapia profunda:
${modoProfundo ? "ATIVADA" : "DESATIVADA"}

Memória do usuário:
${memoriaResumo}
`;

    /* =========================
       OPENAI
    ========================= */

    let respostaIA =
      "Estou aqui com você.";

    try {
      const completion =
        await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.8,
          max_tokens: 300,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `
Emoção: ${emocao}

Mensagem:
${texto}
`,
            },
          ],
        });

      respostaIA =
        completion?.choices?.[0]?.message
          ?.content || respostaIA;
    } catch (e) {
      console.log("Erro OpenAI:", e.message);

      respostaIA =
        "Tive uma instabilidade agora, mas continuo aqui com você 🌱";
    }

    /* =========================
       EVOLUÇÃO
    ========================= */

    const fase = detectarFase(texto);

    if (fase === "dor") {
      respostaIA +=
        "\n\n💭 Me conte o que mais pesa nisso.";
    }

    if (fase === "acao") {
      respostaIA +=
        "\n\n🚀 Você já começou sua mudança.";
    }

    respostaIA += `

✨ Recomendação:
${gerarRecomendacao(emocao)}
`;

    /* =========================
       RESPONDE PRIMEIRO
    ========================= */

    res.json({
      resposta: respostaIA,
    });

    /* =========================
       SALVA ASSÍNCRONO
    ========================= */

    Promise.allSettled([
      supabase.from("memoria_ia").insert([
        {
          user_id: userId,
          texto,
          emocao,
          resposta: respostaIA,
          modo,
        },
      ]),

      supabase
        .from("registros_emocionais")
        .insert([
          {
            user_id: userId,
            emocao,
            texto,
          },
        ]),
    ]).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") {
          console.log(
            "Erro Supabase:",
            r.reason?.message
          );
        }
      });
    });
  } catch (err) {
    console.log("ERRO GERAL:", err.message);

    res.status(500).json({
      resposta:
        "Erro interno no servidor.",
    });
  }
});

/* =========================
   ADMIN
========================= */

app.get("/admin-metricas", async (req, res) => {
  try {
    const { count: usuarios } =
      await supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        });

    const { count: registros } =
      await supabase
        .from("registros_emocionais")
        .select("*", {
          count: "exact",
          head: true,
        });

    const { count: ia } =
      await supabase
        .from("memoria_ia")
        .select("*", {
          count: "exact",
          head: true,
        });

    res.json({
      usuarios: usuarios || 0,
      registros: registros || 0,
      ia: ia || 0,
    });
  } catch (e) {
    console.log(e.message);

    res.status(500).json({
      error: "Erro métricas",
    });
  }
});

/* =========================
   STRIPE
========================= */

app.post(
  "/criar-checkout",
  async (req, res) => {
    try {
      const session =
        await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price:
                process.env
                  .STRIPE_PRICE_ID,
              quantity: 1,
            },
          ],
          success_url:
            process.env.FRONTEND_URL,
          cancel_url:
            process.env.FRONTEND_URL,
        });

      res.json({
        url: session.url,
      });
    } catch (e) {
      console.log(e.message);

      res.status(500).json({
        error: "Erro checkout",
      });
    }
  }
);
app.get("/admin-metricas", async (req, res) => {
  try {
    const { count: usuarios } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true });

    const { count: registros } = await supabase
      .from("memoria_ia")
      .select("*", { count: "exact", head: true });

    const { count: ia } = await supabase
      .from("memoria_ia")
      .select("*", { count: "exact", head: true });

    res.json({
      usuarios: usuarios || 0,
      registros: registros || 0,
      ia: ia || 0,
    });
  } catch (error) {
    console.error("Erro admin métricas:", error);

    res.status(500).json({
      erro: "Erro backend",
    });
  }
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(
    `🚀 Neuro360 backend rodando na porta ${PORT}`
  );
});
