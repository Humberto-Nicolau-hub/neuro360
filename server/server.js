import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(express.json());

/* ======================================================
   CORS
====================================================== */

app.use(
  cors({
    origin: "*",
  })
);

/* ======================================================
   OPENAI
====================================================== */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ======================================================
   ROOT
====================================================== */

app.get("/", (req, res) => {

  res.json({
    online: true,
    api: "NeuroMapa360",
  });
});

/* ======================================================
   HEALTH
====================================================== */

app.get("/health", (req, res) => {

  res.json({
    status: "ok",
  });
});

/* ======================================================
   IA
====================================================== */

app.post("/ia", async (req, res) => {

  try {

    const { mensagem } = req.body;

    if (!mensagem) {

      return res.status(400).json({
        resposta:
          "Mensagem obrigatória",
      });
    }

    console.log(
      "Mensagem recebida:",
      mensagem
    );

    /* ======================================================
       OPENAI
    ====================================================== */

    const completion =
      await openai.chat.completions.create({

        model: "gpt-4o-mini",

        temperature: 0.8,

        max_tokens: 800,

        messages: [
          {
            role: "system",

            content: `
Você é a NeuroMapa360.

Uma IA terapêutica emocional.

Seja:
- humana
- acolhedora
- profunda
- inteligente
- terapêutica
- emocional
- natural
`,
          },

          {
            role: "user",
            content: mensagem,
          },
        ],
      });

    const resposta =
      completion.choices[0]
        .message.content;

    return res.json({
      resposta,
    });

  } catch (error) {

    console.error(
      "ERRO IA:",
      error
    );

    return res.status(500).json({

      erro:
        "Erro interno IA",

      detalhes:
        error.message,
    });
  }
});

/* ======================================================
   START
====================================================== */

const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {

  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});