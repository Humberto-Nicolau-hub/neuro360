import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

import detectarEmocao from "./detector_emocional.js";
import gerarRespostaPNL from "./protocolos_pnl.js";
import calcularScoreEmocional from "./score_emocional.js";
import gerarHeatmapEmocional from "./heatmap_emocional.js";
import gerarRecomendacoes from "./recomendacoes_automaticas.js";
import gerarIntervencaoAutomatica from "./intervencoes_automaticas.js";
import gerarTrilhaTerapeutica from "./trilhas_terapeuticas.js";
import verificarPlano from "./controle_premium.js";
import analisarArquiteturaCognitiva from "./neuro_arquitetura_cognitiva.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* ======================================================
   VALIDACOES
====================================================== */

const requiredEnv = [
  "OPENAI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const envVar of requiredEnv) {

  if (!process.env[envVar]) {

    console.error(
      `ERRO: variável ${envVar} não configurada`
    );
  }
}

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

  res.json({
    status: "online",
    plataforma: "NeuroMapa360",
    versao: "1.0.0"
  });
});

/* ======================================================
   HEALTH CHECK
====================================================== */

app.get("/health", (req, res) => {

  res.json({
    ok: true,
    uptime: process.uptime()
  });
});

/* ======================================================
   DASHBOARD ADMIN
====================================================== */

app.get("/admin/dashboard", async (req, res) => {

  try {

    const { data: memorias, error } =
      await supabase
        .from("memoria_emocional")
        .select("*");

    if (error) {
      throw error;
    }

    const scoreData =
      calcularScoreEmocional(
        memorias || []
      );

    const heatmapData =
      gerarHeatmapEmocional(
        memorias || []
      );

    const usuariosUnicos = [
      ...new Set(
        memorias?.map(
          (m) => m.user_id
        )
      ),
    ];

    const premium = Math.floor(
      usuariosUnicos.length * 0.25
    );

    return res.json({

      totalUsuarios:
        usuariosUnicos.length || 0,

      premium,

      totalRegistros:
        memorias?.length || 0,

      totalMemorias:
        memorias?.length || 0,

      conversao:
        usuariosUnicos.length > 0
          ? (
              (premium /
                usuariosUnicos.length) *
              100
            ).toFixed(1)
          : 0,

      receita: premium * 47,

      emocaoDominante:
        scoreData?.emocaoDominante || null,

      scoreEmocional:
        scoreData?.score || 0,

      tendencia:
        scoreData?.tendencia || null,

      nivel:
        scoreData?.nivel || null,

      periodoCritico:
        heatmapData?.periodoCritico || null,

      heatmap:
        heatmapData?.heatmap || [],
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      erro: "Erro dashboard admin",
      detalhes: error.message
    });
  }
});

/* ======================================================
   IA TERAPEUTICA
====================================================== */

app.post("/ia", async (req, res) => {

  try {

    const {
      mensagem,
      user_id
    } = req.body;

    if (!mensagem) {

      return res.status(400).json({
        erro: "Mensagem obrigatória"
      });
    }

    /* =========================================
       MEMORIA
    ========================================= */

    const { data: memoria } =
      await supabase
        .from("memoria_emocional")
        .select("*")
        .eq(
          "user_id",
          user_id || "anonimo"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    /* =========================================
       USUARIO
    ========================================= */

    const { data: usuario } =
      await supabase
        .from("usuarios")
        .select("*")
        .eq(
          "id",
          user_id || "anonimo"
        )
        .single();

    /* =========================================
       PLANO
    ========================================= */

    const plano =
      verificarPlano(
        usuario || {},
        memoria?.length || 0
      );

    if (
      plano?.limiteAtingido
    ) {

      return res.json({
        premium: false,
        limite: true,

        resposta:
          "Você atingiu o limite do plano gratuito do NeuroMapa360."
      });
    }

    /* =========================================
       ANALISES
    ========================================= */

    const emocaoData =
      detectarEmocao(mensagem);

    const arquiteturaCognitiva =
      analisarArquiteturaCognitiva(mensagem);

    const scoreData =
      calcularScoreEmocional(
        memoria || []
      );

    const heatmapData =
      gerarHeatmapEmocional(
        memoria || []
      );

    const recomendacoes =
      gerarRecomendacoes(
        scoreData,
        emocaoData
      );

    const intervencoes =
      gerarIntervencaoAutomatica(
        scoreData,
        heatmapData
      );

    const trilha =
      gerarTrilhaTerapeutica(
        scoreData,
        emocaoData
      );

    const respostaPNL =
      gerarRespostaPNL(
        emocaoData,
        mensagem
      );

    /* =========================================
       SEGURANCA
    ========================================= */

    const mensagemLower =
      mensagem.toLowerCase();

    const riscoElevado =
      mensagemLower.includes("suicidio") ||
      mensagemLower.includes("me matar") ||
      mensagemLower.includes("nao quero viver");

    if (riscoElevado) {

      return res.json({

        resposta:
          "Você não precisa enfrentar isso sozinho. Procure apoio humano imediato e ligue 188 (CVV)."
      });
    }

    /* =========================================
       CONTEXTO
    ========================================= */

    let contextoAnterior = "";

    if (
      memoria?.length > 0
    ) {

      contextoAnterior =
        memoria
          .slice(0, 5)
          .map(
            (m) => `
Usuário:
${m.mensagem_usuario}

IA:
${m.resposta_ia}

Emoção:
${m.emocao}
`
          )
          .join("\n");
    }

    /* =========================================
       PROMPT
    ========================================= */

    const promptSistema = `
Você é a IA NeuroMapa360.

Atue como:
- terapeuta emocional
- especialista em PNL
- mentor cognitivo
- inteligência emocional terapêutica

Contexto:
${contextoAnterior}

Emoção:
${emocaoData?.emocao}

Resumo terapêutico:
${arquiteturaCognitiva?.resumoTerapeutico}

Score:
${scoreData?.score}

Responda de forma:
- profunda
- humana
- acolhedora
- terapêutica
`;

    /* =========================================
       OPENAI
    ========================================= */

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
      completion
        .choices[0]
        .message.content;

    /* =========================================
       MEMORIA
    ========================================= */

    await supabase
      .from("memoria_emocional")
      .insert([
        {
          user_id:
            user_id || "anonimo",

          mensagem_usuario:
            mensagem,

          resposta_ia:
            resposta,

          emocao:
            emocaoData?.emocao,

          intensidade:
            emocaoData?.intensidade,
        },
      ]);

    /* =========================================
       RESPOSTA
    ========================================= */

    return res.json({

      premium:
        plano?.premium,

      plano:
        plano?.plano,

      restante:
        plano?.restante,

      resposta,

      emocao_detectada:
        emocaoData,

      arquitetura_cognitiva:
        arquiteturaCognitiva,

      perfil_emocional:
        scoreData,

      heatmap:
        heatmapData,

      recomendacoes,

      intervencoes,

      trilha,

      memoria_ativa:
        memoria?.length > 0,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      erro: "Erro IA terapêutica",
      detalhes: error.message
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
========================================
`);
});
