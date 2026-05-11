import express from "express";

import cors from "cors";

import OpenAI from "openai";

import dotenv from "dotenv";

dotenv.config();

const app = express();

/* ======================================================
   CONFIG
====================================================== */

app.use(cors());

app.use(express.json());

const PORT =
  process.env.PORT || 3001;

/* ======================================================
   OPENAI
====================================================== */

const openai =
  new OpenAI({

    apiKey:
      process.env.OPENAI_API_KEY,
  });

/* ======================================================
   HEALTH
====================================================== */

app.get("/", (req, res) => {

  res.json({

    online: true,

    api: "NeuroMapa360",
  });
});

app.get("/health", (req, res) => {

  res.json({
    status: "ok",
  });
});

/* ======================================================
   MEMORIA EMOCIONAL
====================================================== */

const memoriaUsuarios = {};

/* ======================================================
   ANALISE EMOCIONAL
====================================================== */

function analisarEstadoEmocional(
  texto
) {

  const textoLower =
    texto.toLowerCase();

  /* =========================================
     PADRÃO
  ========================================= */

  let emocao =
    "Equilibrado";

  let score = 82;

  let hawkins = 540;

  let consciencia =
    "Expansão";

  let trilha =
    "Reequilíbrio";

  let intervencao =
    "Respiração guiada";

  /* =========================================
     ANSIEDADE
  ========================================= */

  if (

    textoLower.includes(
      "ansioso"
    ) ||

    textoLower.includes(
      "ansiedade"
    ) ||

    textoLower.includes(
      "medo"
    ) ||

    textoLower.includes(
      "nervoso"
    )

  ) {

    emocao =
      "Ansiedade";

    score = 42;

    hawkins = 125;

    consciencia =
      "Contração";

    trilha =
      "Acalmamento Neural";

    intervencao =
      "Respiração profunda";
  }

  /* =========================================
     TRISTEZA
  ========================================= */

  if (

    textoLower.includes(
      "triste"
    ) ||

    textoLower.includes(
      "depress"
    ) ||

    textoLower.includes(
      "sozinho"
    ) ||

    textoLower.includes(
      "desanimado"
    )

  ) {

    emocao =
      "Tristeza";

    score = 28;

    hawkins = 75;

    consciencia =
      "Desmotivação";

    trilha =
      "Reconexão Emocional";

    intervencao =
      "Acolhimento terapêutico";
  }

  /* =========================================
     RAIVA
  ========================================= */

  if (

    textoLower.includes(
      "raiva"
    ) ||

    textoLower.includes(
      "ódio"
    ) ||

    textoLower.includes(
      "irritado"
    ) ||

    textoLower.includes(
      "estresse"
    )

  ) {

    emocao =
      "Raiva";

    score = 35;

    hawkins = 150;

    consciencia =
      "Reatividade";

    trilha =
      "Descompressão";

    intervencao =
      "Relaxamento neural";
  }

  /* =========================================
     EVOLUÇÃO
  ========================================= */

  if (

    textoLower.includes(
      "clareza"
    ) ||

    textoLower.includes(
      "foco"
    ) ||

    textoLower.includes(
      "melhor"
    ) ||

    textoLower.includes(
      "evoluindo"
    )

  ) {

    emocao =
      "Evolução";

    score = 91;

    hawkins = 700;

    consciencia =
      "Alta percepção";

    trilha =
      "Expansão Cognitiva";

    intervencao =
      "Potencialização mental";
  }

  return {

    emocao,

    score,

    hawkins,

    consciencia,

    trilha,

    intervencao,
  };
}

/* ======================================================
   IA TERAPÊUTICA
====================================================== */

app.post("/ia", async (req, res) => {

  try {

    const {

      mensagem,

      perfil,

      user_id,
    } = req.body;

    /* =========================================
       SEGURANÇA
    ========================================= */

    if (!mensagem) {

      return res
        .status(400)
        .json({

          erro:
            "Mensagem obrigatória.",
        });
    }

    const usuarioId =
      user_id || "anonimo";

    /* =========================================
       MEMÓRIA INDIVIDUAL
    ========================================= */

    if (
      !memoriaUsuarios[
        usuarioId
      ]
    ) {

      memoriaUsuarios[
        usuarioId
      ] = [];
    }

    memoriaUsuarios[
      usuarioId
    ].push({

      role: "user",

      content: mensagem,
    });

    /* =========================================
       LIMITA HISTÓRICO
    ========================================= */

    if (

      memoriaUsuarios[
        usuarioId
      ].length > 12

    ) {

      memoriaUsuarios[
        usuarioId
      ] =
        memoriaUsuarios[
          usuarioId
        ].slice(-12);
    }

    /* =========================================
       ANALISE EMOCIONAL
    ========================================= */

    const emocional =
      analisarEstadoEmocional(
        mensagem
      );

    /* =========================================
       PROMPT TERAPÊUTICO
    ========================================= */

    let promptSistema =

      `
Você é a NeuroMapa360.

Uma IA terapêutica emocional,
acolhedora, humana,
profissional e neuro sistêmica.

REGRAS:

- Responda como terapeuta emocional.
- Seja empático.
- Nunca seja frio.
- Nunca seja robótico.
- Fale em português do Brasil.
- Gere acolhimento emocional.
- Estimule consciência emocional.
- Utilize linguagem humana.
- Respostas médias.
- Evite textos gigantes.
- Traga sensação de presença real.
`;

    /* =========================================
       PREMIUM
    ========================================= */

    if (
      perfil === "premium"
    ) {

      promptSistema +=

        `
USUÁRIO PREMIUM:

- respostas mais profundas
- mais inteligência emocional
- mais análise emocional
- mais clareza terapêutica
- mais personalização
`;
    }

    /* =========================================
       OPENAI
    ========================================= */

    const completion =
      await openai.chat.completions.create({

        model:
          "gpt-4o-mini",

        temperature: 0.8,

        messages: [

          {
            role: "system",

            content:
              promptSistema,
          },

          ...memoriaUsuarios[
            usuarioId
          ],
        ],
      });

    const respostaIA =

      completion.choices[0]
        .message.content;

    /* =========================================
       SALVA MEMÓRIA IA
    ========================================= */

    memoriaUsuarios[
      usuarioId
    ].push({

      role: "assistant",

      content: respostaIA,
    });

    /* =========================================
       RETORNO COMPLETO
    ========================================= */

    return res.json({

      resposta:
        respostaIA,

      emocao_detectada: {

        emocao:
          emocional.emocao,
      },

      score_emocional:
        emocional.score,

      frequencia_hawkins: {

        frequencia:
          emocional.hawkins,
      },

      nivel_consciencia:
        emocional.consciencia,

      trilha_terapeutica:
        emocional.trilha,

      intervencao:
        emocional.intervencao,
    });

  } catch (erro) {

    console.log(
      "ERRO IA:",
      erro?.message
    );

    return res
      .status(500)
      .json({

        erro:
          "Erro interno IA.",

        detalhe:
          erro?.message,
      });
  }
});

/* ======================================================
   START
====================================================== */

app.listen(PORT, () => {

  console.log(

    `NeuroMapa360 ONLINE na porta ${PORT}`
  );
});