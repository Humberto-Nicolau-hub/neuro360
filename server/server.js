import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

import {
  detectarEmocao,
} from "./detector_emocional.js";

import {
  gerarRespostaPNL,
} from "./protocolos_pnl.js";

import {
  calcularScoreEmocional,
} from "./score_emocional.js";

import {
  gerarHeatmapEmocional,
} from "./heatmap_emocional.js";

import {
  gerarRecomendacoes,
} from "./recomendacoes_automaticas.js";

import {
  gerarIntervencaoAutomatica,
} from "./intervencoes_automaticas.js";

import {
  gerarTrilhaTerapeutica,
} from "./trilhas_terapeuticas.js";

import {
  verificarPlano,
} from "./controle_premium.js";

import {
  analisarArquiteturaCognitiva,
} from "./neuro_arquitetura_cognitiva.js";

import {
  calcularFrequenciaHawkins,
} from "./frequencia_hawkins.js";

import {
  preverEstadoEmocional,
} from "./predicao_emocional.js";

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

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* ======================================================
   VALIDACOES
====================================================== */

const requiredEnv = [
  "OPENAI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
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

  return res.json({
    status: "online",
    plataforma: "NeuroMapa360",
    versao: "5.1.0",
  });
});

/* ======================================================
   HEALTH
====================================================== */

app.get("/health", (req, res) => {

  return res.json({
    ok: true,
    uptime: process.uptime(),
    plataforma: "NeuroMapa360",
  });
});

/* ======================================================
   DASHBOARD ADMIN
====================================================== */

app.get("/admin/dashboard", async (req, res) => {

  try {

    const {
      data: memorias,
      error,
    } = await supabase
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

      receita:
        premium * 47,

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
      detalhes:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

/* ======================================================
   FUNCAO CENTRAL IA
====================================================== */

async function processarIA(req, res) {

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

    /* =========================================
       MEMORIA
    ========================================= */

    const {
      data: memoria,
      error: memoriaError,
    } = await supabase
      .from("memoria_emocional")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(10);

    if (memoriaError) {

      console.error(
        "Erro memória:",
        memoriaError.message
      );
    }

    /* =========================================
       CONTEXTO
    ========================================= */

    const contextoMemoria =
      memoria?.length > 0
        ? memoria
            .map(
              (m) => `
Emoção: ${m.emocao}
Intensidade: ${m.intensidade}
Frequência Hawkins: ${m.frequencia_hawkins}
Usuário: ${m.mensagem_usuario}
IA: ${m.resposta_ia}
`
            )
            .join("\n")
        : "Sem histórico emocional.";

    /* =========================================
       USUARIO
    ========================================= */

    const {
      data: usuario,
    } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    /* =========================================
       PLANO
    ========================================= */

    const plano =
      verificarPlano(
        usuario || {},
        memoria?.length || 0
      );

    if (plano?.limiteAtingido) {

      return res.json({
        premium: false,
        limite: true,
        resposta:
          "Você atingiu o limite do plano gratuito do NeuroMapa360.",
      });
    }

    /* =========================================
       ANALISES
    ========================================= */

    const emocaoData =
      detectarEmocao(mensagem);

    const hawkinsData =
      calcularFrequenciaHawkins(
        emocaoData?.emocao
      );

    const predicaoEmocional =
      preverEstadoEmocional(
        memoria || []
      );

    const arquiteturaCognitiva =
      analisarArquiteturaCognitiva(
        mensagem
      );

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

    const texto =
      mensagem.toLowerCase();

    const riscoElevado =
      texto.includes("suicidio") ||
      texto.includes("suicídio") ||
      texto.includes("me matar") ||
      texto.includes("não quero viver") ||
      texto.includes("nao quero viver");

    if (riscoElevado) {

      return res.json({
        resposta:
          "Você não precisa enfrentar isso sozinho. Procure apoio humano imediato. Ligue 188 (CVV).",
      });
    }

    /* =========================================
       PROMPT SISTEMA
    ========================================= */

    const promptSistema = `
Você é a IA NeuroMapa360.

Você atua como:
- terapeuta emocional
- especialista em PNL
- mentor cognitivo
- inteligência emocional terapêutica

Objetivos:
- acolher
- responder humanamente
- evitar respostas genéricas
- criar vínculo emocional
- demonstrar continuidade terapêutica

Histórico:
${contextoMemoria}

Emoção:
${emocaoData?.emocao}

Intensidade:
${emocaoData?.intensidade}

Frequência Hawkins:
${hawkinsData?.frequencia}

Nível:
${hawkinsData?.nivel}

Resumo terapêutico:
${arquiteturaCognitiva?.resumoTerapeutico}
`;

    /* =========================================
       OPENAI
    ========================================= */

    let resposta = "";

    try {

      const completion =
        await openai.chat.completions.create({

          model: "gpt-4o-mini",

          temperature: 0.9,

          max_tokens: 1200,

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

      resposta =
        completion?.choices?.[0]?.message?.content;

    } catch (openaiError) {

      console.error(
        "ERRO OPENAI:",
        openaiError.message
      );

      resposta = respostaPNL;
    }

    if (!resposta) {

      resposta =
        respostaPNL ||
        "Estou aqui com você.";
    }

    /* =========================================
       SALVAR MEMORIA
    ========================================= */

    await supabase
      .from("memoria_emocional")
      .insert([
        {
          user_id: userId,

          mensagem_usuario:
            mensagem,

          resposta_ia:
            resposta,

          emocao:
            emocaoData?.emocao,

          intensidade:
            emocaoData?.intensidade,

          frequencia_hawkins:
            hawkinsData?.frequencia,

          nivel_hawkins:
            hawkinsData?.nivel,
        },
      ]);

    /* =========================================
       RESPOSTA FINAL
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

      frequencia_hawkins:
        hawkinsData,

      predicao_emocional:
        predicaoEmocional,

      arquitetura_cognitiva:
        arquiteturaCognitiva,

      score_emocional:
        scoreData?.score,

      nivel_consciencia:
        hawkinsData?.nivel,

      perfil_emocional:
        scoreData,

      heatmap:
        heatmapData,

      recomendacoes,

      intervencoes,

      intervencao:
        intervencoes?.[0]?.titulo || null,

      protocolo_pnl:
        respostaPNL,

      trilha_terapeutica:
        trilha?.nome,

      trilha_completa:
        trilha,

      memoria_ativa:
        memoria?.length > 0,

      contexto_utilizado:
        memoria?.length || 0,
    });

  } catch (error) {

    console.error(
      "ERRO IA:",
      error
    );

    return res.status(500).json({

      erro:
        "Erro IA terapêutica",

      detalhes:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
}

/* ======================================================
   ROTAS IA
====================================================== */

app.post("/ia", processarIA);

app.post("/api/chat", processarIA);

/* ======================================================
   STATUS EMOCIONAL
====================================================== */

app.post("/api/status-emocional", async (req, res) => {

  try {

    const { mensagem } = req.body;

    if (!mensagem) {

      return res.json({
        status: "Neutro",
      });
    }

    const emocao =
      detectarEmocao(mensagem);

    let status = "Equilibrado";

    const texto =
      mensagem.toLowerCase();

    if (
      texto.includes("ansioso") ||
      texto.includes("ansiedade")
    ) {

      status = "Ansioso";

    } else if (
      texto.includes("triste") ||
      texto.includes("depress")
    ) {

      status = "Triste";

    } else if (
      texto.includes("raiva")
    ) {

      status = "Raiva";

    } else if (
      texto.includes("desmotivado")
    ) {

      status = "Desmotivado";

    } else if (
      texto.includes("procrast")
    ) {

      status = "Procrastinador";
    }

    return res.json({
      status,
      emocao,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      erro: "Erro status emocional",
    });
  }
});

/* ======================================================
   TRATAMENTO GLOBAL
====================================================== */

process.on("unhandledRejection", (err) => {

  console.error(
    "UNHANDLED REJECTION:",
    err
  );
});

process.on("uncaughtException", (err) => {

  console.error(
    "UNCAUGHT EXCEPTION:",
    err
  );
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
VERSAO: 5.1.0
========================================
`);
});