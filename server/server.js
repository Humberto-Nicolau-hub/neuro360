import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

/* ======================================================
   CORS
====================================================== */

const allowedOrigins = [
  "https://neuromapa360.ia.br",
  "https://www.neuromapa360.ia.br",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {

      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS não permitido")
      );
    },

    methods: ["GET", "POST", "OPTIONS"],

    credentials: true,
  })
);

app.use(express.json());

/* ======================================================
   OPENAI
====================================================== */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ======================================================
   SUPABASE
====================================================== */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ======================================================
   ROOT
====================================================== */

app.get("/", (req, res) => {

  return res.json({
    status: "online",
    plataforma: "NeuroMapa360",
    versao: "6.0.0",
  });
});

/* ======================================================
   HEALTH
====================================================== */

app.get("/health", (req, res) => {

  return res.json({
    ok: true,
    uptime: process.uptime(),
  });
});

/* ======================================================
   IA TERAPÊUTICA
====================================================== */

app.post("/ia", async (req, res) => {

  try {

    const {
      mensagem,
      user_id,
    } = req.body;

    if (!mensagem) {

      return res.status(400).json({
        erro: "Mensagem obrigatória",
      });
    }

    const userId =
      user_id || "anonimo";

    /* ======================================================
       MEMORIA
    ====================================================== */

    const {
      data: memoria,
    } = await supabase
      .from("memoria_emocional")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(12);

    const contexto =
      memoria?.length > 0
        ? memoria
            .map(
              (m) =>
                `
Usuário: ${m.mensagem_usuario}
IA: ${m.resposta_ia}
`
            )
            .join("\n")
        : "";

    /* ======================================================
       SEGURANCA
    ====================================================== */

    const texto =
      mensagem.toLowerCase();

    const riscoElevado =
      texto.includes("suicidio") ||
      texto.includes("suicídio") ||
      texto.includes("me matar") ||
      texto.includes("não quero viver");

    if (riscoElevado) {

      return res.json({
        resposta:
          "Você não precisa enfrentar isso sozinho. Procure apoio humano imediato. Ligue 188 (CVV).",
      });
    }

    /* ======================================================
       PROMPT
    ====================================================== */

    const promptSistema = `
Você é a NeuroMapa360.

Uma IA terapêutica premium.

Especialista em:
- ansiedade
- depressão
- PNL
- neurociência
- trauma emocional
- sabotagem emocional
- reprogramação mental

REGRAS:
- nunca responda roboticamente
- nunca repita respostas
- responda de forma humana
- seja acolhedora
- demonstre inteligência emocional
- faça perguntas terapêuticas
- use linguagem emocional profunda
- fale como terapeuta premium

Histórico emocional:
${contexto}
`;

    /* ======================================================
       OPENAI
    ====================================================== */

    const completion =
      await openai.chat.completions.create({

        model: "gpt-4o-mini",

        temperature: 0.9,

        max_tokens: 1000,

        messages: [
          {
            role: "system",
            content: promptSistema,
          },
          {
            role: "user",
            content: mensagem,
          },
        ],
      });

    const resposta =
      completion?.choices?.[0]
        ?.message?.content ||
      "Estou aqui com você.";

    /* ======================================================
       SALVAR MEMORIA
    ====================================================== */

    await supabase
      .from("memoria_emocional")
      .insert([
        {
          user_id: userId,

          mensagem_usuario:
            mensagem,

          resposta_ia:
            resposta,

          emocao: "analise",

          intensidade: 7,
        },
      ]);

    /* ======================================================
       RESPOSTA
    ====================================================== */

    return res.json({
      resposta,
      memoria_ativa: true,
      contexto_utilizado:
        memoria?.length || 0,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      erro:
        "Erro IA terapêutica",
    });
  }
});

/* ======================================================
   START
====================================================== */

const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(`
========================================
NeuroMapa360 ONLINE
PORTA: ${PORT}
VERSAO: 6.0.0
========================================
`);
});