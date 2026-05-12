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
    ) ||

    textoLower.includes(
      "preocupado"
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
    ) ||

    textoLower.includes(
      "feliz"
    ) ||

    textoLower.includes(
      "motivado"
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
   CARREGAR MEMÓRIA
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
   PERFIL EMOCIONAL
====================================================== */

async function gerarPerfilEmocional(
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
        {
          ascending: false,
        }
      )

      .limit(20);

    if (
      error ||
      !data ||
      data.length === 0
    ) {

      return {

        resumo:
          "",

        scoreMedio: 0,

        emocaoDominante:
          "Equilibrado",

        tendencia:
          "Neutra",
      };
    }

    /* =========================================
       SCORE MÉDIO
    ========================================= */

    const somaScores =
      data.reduce(
        (
          total,
          item
        ) =>
          total +
          (item.score || 0),
        0
      );

    const scoreMedio =
      Math.round(
        somaScores /
          data.length
      );

    /* =========================================
       EMOÇÃO DOMINANTE
    ========================================= */

    const contador = {};

    data.forEach((item) => {

      const emocao =
        item.emocao ||
        "Equilibrado";

      contador[emocao] =

        (
          contador[emocao] || 0
        ) + 1;
    });

    const emocaoDominante =
      Object.keys(
        contador
      ).reduce((a, b) =>
        contador[a] >
        contador[b]
          ? a
          : b
      );

    /* =========================================
       TENDÊNCIA
    ========================================= */

    let tendencia =
      "Neutra";

    if (
      scoreMedio < 45
    ) {

      tendencia =
        "Desgaste emocional";
    }

    if (
      scoreMedio > 75
    ) {

      tendencia =
        "Evolução positiva";
    }

    /* =========================================
       RESUMO TERAPÊUTICO
    ========================================= */

    let resumo =
      "";

    if (
      emocaoDominante ===
      "Ansiedade"
    ) {

      resumo =
        "Percebo sinais recorrentes de ansiedade e sobrecarga emocional nas últimas interações.";
    }

    if (
      emocaoDominante ===
      "Tristeza"
    ) {

      resumo =
        "Seu histórico demonstra momentos de desmotivação emocional e necessidade de acolhimento terapêutico.";
    }

    if (
      emocaoDominante ===
      "Raiva"
    ) {

      resumo =
        "Há sinais de tensão emocional e reatividade recorrente nas últimas sessões.";
    }

    if (
      emocaoDominante ===
      "Evolução"
    ) {

      resumo =
        "Seu histórico emocional demonstra evolução positiva e maior clareza cognitiva.";
    }

    return {

      resumo,

      scoreMedio,

      emocaoDominante,

      tendencia,
    };

  } catch (erro) {

    console.log(
      "ERRO PERFIL:",
      erro.message
    );

    return {

      resumo: "",

      scoreMedio: 0,

      emocaoDominante:
        "Equilibrado",

      tendencia:
        "Neutra",
    };
  }
}

/* ======================================================
   BUSCAR PERFIL
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
   DASHBOARD ANALÍTICO
====================================================== */

app.get(
  "/dashboard/:user_id",
  async (req, res) => {

    try {

      const {
        user_id,
      } = req.params;

      const {

        data,

        error,

      } = await supabase

        .from("conversas")

        .select("*")

        .eq(
          "user_id",
          user_id
        )

        .order(
          "created_at",
          {
            ascending: false,
          }
        )

        .limit(30);

      if (error) {

        return res
          .status(500)
          .json({

            erro:
              error.message,
          });
      }

      if (
        !data ||
        data.length === 0
      ) {

        return res.json({

          historico: [],

          scoreMedio: 0,

          hawkinsMedio: 0,

          emocaoDominante:
            "Sem dados",

          insight:
            "Ainda não há dados emocionais suficientes.",
        });
      }

      const totalScore =
        data.reduce(
          (
            acc,
            item
          ) =>
            acc +
            (item.score || 0),
          0
        );

      const totalHawkins =
        data.reduce(
          (
            acc,
            item
          ) =>
            acc +
            (item.hawkins || 0),
          0
        );

      const scoreMedio =
        Math.round(
          totalScore /
            data.length
        );

      const hawkinsMedio =
        Math.round(
          totalHawkins /
            data.length
        );

      const contadorEmocoes =
        {};

      data.forEach((item) => {

        const emocao =
          item.emocao ||
          "Neutro";

        contadorEmocoes[
          emocao
        ] =

          (
            contadorEmocoes[
              emocao
            ] || 0
          ) + 1;
      });

      const emocaoDominante =
        Object.keys(
          contadorEmocoes
        ).reduce((a, b) =>
          contadorEmocoes[a] >
          contadorEmocoes[b]
            ? a
            : b
        );

      let insight =
        "Seu padrão emocional está equilibrado.";

      if (
        scoreMedio < 40
      ) {

        insight =
          "Detectamos sinais emocionais de desgaste e necessidade de acolhimento.";
      }

      if (
        scoreMedio > 75
      ) {

        insight =
          "Você apresenta evolução emocional positiva nas últimas sessões.";
      }

      const historico =
        data.map(
          (item) => ({

            emocao:
              item.emocao,

            score:
              item.score,

            hawkins:
              item.hawkins,

            created_at:
              item.created_at,
          })
        );

      return res.json({

        totalConversas:
          data.length,

        scoreMedio,

        hawkinsMedio,

        emocaoDominante,

        insight,

        historico,
      });

    } catch (erro) {

      console.log(
        "ERRO DASHBOARD:",
        erro.message
      );

      return res
        .status(500)
        .json({

          erro:
            "Erro dashboard.",
        });
    }
  }
);

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

    let perfilUsuario =
      null;

    if (email) {

      perfilUsuario =
        await buscarPerfilUsuario(
          email
        );
    }

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

    memoriaUsuarios[
      usuarioId
    ].push({

      role: "user",

      content: mensagem,
    });

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

    const emocional =
      analisarEstadoEmocional(
        mensagem
      );

    /* =========================================
       PERFIL EMOCIONAL INTELIGENTE
    ========================================= */

    const perfilEmocional =
      await gerarPerfilEmocional(
        usuarioId
      );

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

CONTEXTO EMOCIONAL DO USUÁRIO:

- Emoção dominante:
${perfilEmocional.emocaoDominante}

- Tendência emocional:
${perfilEmocional.tendencia}

- Score emocional médio:
${perfilEmocional.scoreMedio}

- Resumo terapêutico:
${perfilEmocional.resumo}
`;

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

    memoriaUsuarios[
      usuarioId
    ].push({

      role: "assistant",

      content: respostaIA,
    });

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

      perfil_emocional:
        perfilEmocional,
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