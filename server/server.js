import express from "express";

import cors from "cors";

import OpenAI from "openai";

import dotenv from "dotenv";

import { createClient } from "@supabase/supabase-js";

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
   SUPABASE
====================================================== */

const supabase =
  createClient(

    process.env.SUPABASE_URL,

    process.env
      .SUPABASE_SERVICE_ROLE_KEY
  );

/* ======================================================
   HEALTH
====================================================== */

app.get("/", (req, res) => {

  res.json({

    online: true,

    api: "NeuroMapa360",

    banco: "Supabase conectado",
  });
});

app.get("/health", (req, res) => {

  res.json({

    status: "ok",
  });
});

/* ======================================================
   MEMORIA CACHE
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
   CARREGAR MEMÓRIA DO SUPABASE
====================================================== */

async function carregarMemoriaUsuario(
  usuarioId
) {

  try {

    const {

      data,

      error,

    } = await supabase

      .from("conversas")

      .select("*")

      .eq(
        "user_id",
        usuarioId
      )

      .order(
        "created_at",
        { ascending: true }
      )

      .limit(10);

    if (error) {

      console.log(
        "ERRO MEMÓRIA:",
        error.message
      );

      return [];
    }

    const memoria = [];

    data.forEach((item) => {

      memoria.push({

        role: "user",

        content:
          item.mensagem,
      });

      memoria.push({

        role: "assistant",

        content:
          item.resposta,
      });
    });

    return memoria;

  } catch (erro) {

    console.log(
      "ERRO CARREGAR MEMÓRIA:",
      erro.message
    );

    return [];
  }
}

/* ======================================================
   BUSCAR PERFIL USUÁRIO
====================================================== */

async function buscarPerfilUsuario(
  email
) {

  try {

    const {

      data,

      error,

    } = await supabase

      .from("profiles")

      .select("*")

      .eq("email", email)

      .single();

    if (error) {

      return null;
    }

    return data;

  } catch {

    return null;
  }
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

      email,
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
       BUSCA PERFIL
    ========================================= */

    let perfilUsuario = null;

    if (email) {

      perfilUsuario =
        await buscarPerfilUsuario(
          email
        );
    }

    /* =========================================
       DEFINE PLANO
    ========================================= */

    const planoUsuario =

      perfilUsuario?.plano ||

      perfil ||

      "free";

    const isPremium =

      planoUsuario ===
      "premium";

    const isAdmin =

      perfilUsuario?.is_admin ===
      true;

    /* =========================================
       CARREGA MEMÓRIA
    ========================================= */

    if (
      !memoriaUsuarios[
        usuarioId
      ]
    ) {

      memoriaUsuarios[
        usuarioId
      ] =
        await carregarMemoriaUsuario(
          usuarioId
        );
    }

    /* =========================================
       SALVA NOVA MSG
    ========================================= */

    memoriaUsuarios[
      usuarioId
    ].push({

      role: "user",

      content: mensagem,
    });

    /* =========================================
       LIMITA MEMÓRIA
    ========================================= */

    if (

      memoriaUsuarios[
        usuarioId
      ].length > 14

    ) {

      memoriaUsuarios[
        usuarioId
      ] =
        memoriaUsuarios[
          usuarioId
        ].slice(-14);
    }

    /* =========================================
       ANÁLISE EMOCIONAL
    ========================================= */

    const emocional =
      analisarEstadoEmocional(
        mensagem
      );

    /* =========================================
       PROMPT SISTEMA
    ========================================= */

    let promptSistema =

      `
Você é a NeuroMapa360.

Uma IA terapêutica emocional,
acolhedora, humana,
profissional e neuro sistêmica.

REGRAS:

- Seja extremamente humana
- Seja emocionalmente inteligente
- Nunca seja fria
- Nunca pareça robótica
- Gere acolhimento emocional
- Utilize linguagem natural
- Português do Brasil
- Faça respostas terapêuticas
- Respostas médias
- Demonstre presença emocional
`;

    /* =========================================
       PREMIUM
    ========================================= */

    if (
      isPremium
    ) {

      promptSistema +=

        `
USUÁRIO PREMIUM:

- respostas profundas
- mais inteligência emocional
- análise emocional avançada
- maior personalização
- linguagem terapêutica avançada
`;
    }

    /* =========================================
       ADMIN
    ========================================= */

    if (
      isAdmin
    ) {

      promptSistema +=

        `
USUÁRIO ADMIN:

- acesso total
- sem limitações
- análises mais completas
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
       MEMÓRIA CACHE
    ========================================= */

    memoriaUsuarios[
      usuarioId
    ].push({

      role: "assistant",

      content: respostaIA,
    });

    /* =========================================
       SALVA NO SUPABASE
    ========================================= */

    await supabase

      .from("conversas")

      .insert({

        user_id:
          usuarioId,

        mensagem,

        resposta:
          respostaIA,

        emocao:
          emocional.emocao,

        score:
          emocional.score,

        hawkins:
          emocional.hawkins,

        consciencia:
          emocional.consciencia,

        trilha:
          emocional.trilha,

        intervencao:
          emocional.intervencao,
      });

    /* =========================================
       RETORNO
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

      premium:
        isPremium,

      admin:
        isAdmin,
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