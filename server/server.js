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

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 3001;

/* ======================================================
   OPENAI
====================================================== */

if (!process.env.OPENAI_API_KEY) {
  console.log("❌ OPENAI_API_KEY NÃO ENCONTRADA");
}

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
   HEALTH CHECKS
====================================================== */

app.get("/", (req, res) => {
  res.json({
    online: true,
    api: "NeuroMapa360",
    status: "ONLINE",
    servidor: "Render",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    api: "NeuroMapa360",
    backend: true,
  });
});

/* ======================================================
   TESTE API IA
====================================================== */

app.get("/api/ia", (req, res) => {
  res.json({
    online: true,
    rota: "/api/ia",
    status: "funcionando",
  });
});

/* ======================================================
   MEMORIA CACHE
====================================================== */

const memoriaUsuarios = {};

/* ======================================================
   ANALISE EMOCIONAL
====================================================== */

function analisarEstadoEmocional(texto) {
  const textoLower = texto.toLowerCase();

  let emocao = "Equilibrado";
  let score = 82;
  let hawkins = 540;
  let consciencia = "Expansão";
  let trilha = "Reequilíbrio";
  let intervencao = "Respiração guiada";

  if (
    textoLower.includes("ansioso") ||
    textoLower.includes("ansiedade") ||
    textoLower.includes("medo") ||
    textoLower.includes("nervoso") ||
    textoLower.includes("preocupado")
  ) {
    emocao = "Ansioso";
    score = 42;
    hawkins = 100;
    consciencia = "Contração";
    trilha = "Acalmamento Neural";
    intervencao = "Respiração profunda";
  }

  if (
    textoLower.includes("triste") ||
    textoLower.includes("depress") ||
    textoLower.includes("sozinho") ||
    textoLower.includes("desanimado")
  ) {
    emocao = "Tristeza";
    score = 28;
    hawkins = 75;
    consciencia = "Desmotivação";
    trilha = "Reconexão Emocional";
    intervencao = "Acolhimento terapêutico";
  }

  if (
    textoLower.includes("raiva") ||
    textoLower.includes("ódio") ||
    textoLower.includes("irritado") ||
    textoLower.includes("estresse")
  ) {
    emocao = "Raiva";
    score = 35;
    hawkins = 150;
    consciencia = "Reatividade";
    trilha = "Descompressão";
    intervencao = "Relaxamento neural";
  }

  if (
    textoLower.includes("clareza") ||
    textoLower.includes("foco") ||
    textoLower.includes("melhor") ||
    textoLower.includes("evoluindo") ||
    textoLower.includes("feliz") ||
    textoLower.includes("motivado")
  ) {
    emocao = "Evolução";
    score = 91;
    hawkins = 700;
    consciencia = "Alta percepção";
    trilha = "Expansão Cognitiva";
    intervencao = "Potencialização mental";
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

async function carregarMemoriaUsuario(usuarioId) {
  try {
    const { data, error } = await supabase
      .from("conversas")
      .select("*")
      .eq("user_id", usuarioId)
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      console.log("ERRO MEMÓRIA:", error.message);
      return [];
    }

    const memoria = [];

    data.forEach((item) => {
      memoria.push({
        role: "user",
        content: item.mensagem,
      });

      memoria.push({
        role: "assistant",
        content: item.resposta,
      });
    });

    return memoria;
  } catch (erro) {
    console.log("ERRO CARREGAR MEMÓRIA:", erro.message);
    return [];
  }
}

/* ======================================================
   PERFIL EMOCIONAL
====================================================== */

async function gerarPerfilEmocional(usuarioId) {
  try {
    const { data, error } = await supabase
      .from("conversas")
      .select("*")
      .eq("user_id", usuarioId)
      .order("created_at", {
        ascending: false,
      })
      .limit(20);

    if (error || !data || data.length === 0) {
      return {
        resumo: "",
        scoreMedio: 0,
        emocaoDominante: "Equilibrado",
        tendencia: "Neutra",
      };
    }

    const somaScores = data.reduce(
      (total, item) => total + (item.score || 0),
      0
    );

    const scoreMedio = Math.round(
      somaScores / data.length
    );

    const contador = {};

    data.forEach((item) => {
      const emocao =
        item.emocao || "Equilibrado";

      contador[emocao] =
        (contador[emocao] || 0) + 1;
    });

    const emocaoDominante =
      Object.keys(contador).reduce((a, b) =>
        contador[a] > contador[b]
          ? a
          : b
      );

    let tendencia = "Neutra";

    if (scoreMedio < 45) {
      tendencia = "Desgaste emocional";
    }

    if (scoreMedio > 75) {
      tendencia = "Evolução positiva";
    }

    let resumo = "";

    if (emocaoDominante === "Ansiedade") {
      resumo =
        "Percebo sinais recorrentes de ansiedade e sobrecarga emocional.";
    }

    if (emocaoDominante === "Tristeza") {
      resumo =
        "Seu histórico demonstra necessidade de acolhimento emocional.";
    }

    if (emocaoDominante === "Raiva") {
      resumo =
        "Há sinais de tensão emocional e reatividade.";
    }

    if (emocaoDominante === "Evolução") {
      resumo =
        "Seu histórico demonstra evolução emocional positiva.";
    }

    return {
      resumo,
      scoreMedio,
      emocaoDominante,
      tendencia,
    };
  } catch (erro) {
    console.log("ERRO PERFIL:", erro.message);

    return {
      resumo: "",
      scoreMedio: 0,
      emocaoDominante: "Equilibrado",
      tendencia: "Neutra",
    };
  }
}

/* ======================================================
   IA TERAPÊUTICA PRINCIPAL
====================================================== */

async function processarIA(req, res) {
  try {
    console.log("BODY RECEBIDO:", req.body);

    const {
      mensagem,
      user_id,
    } = req.body;

    if (!mensagem) {
      return res.status(400).json({
        erro: "Mensagem obrigatória.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        erro: "OPENAI_API_KEY ausente",
      });
    }

    const usuarioId = user_id || "anonimo";

    const emocional =
      analisarEstadoEmocional(mensagem);

    if (!memoriaUsuarios[usuarioId]) {
      memoriaUsuarios[usuarioId] =
        await carregarMemoriaUsuario(
          usuarioId
        );
    }

    memoriaUsuarios[usuarioId].push({
      role: "user",
      content: mensagem,
    });

    if (
      memoriaUsuarios[usuarioId].length > 14
    ) {
      memoriaUsuarios[usuarioId] =
        memoriaUsuarios[usuarioId].slice(-14);
    }

    const perfilEmocional =
      await gerarPerfilEmocional(usuarioId);

    const promptSistema = `

Você é Neuro360 IA.

Você conversa como um terapeuta humano experiente usando PNL, escuta ativa e neurociência.

REGRAS ABSOLUTAS:

- Máximo 2 frases.
- Máximo 30 palavras.
- Nunca criar listas.
- Nunca numerar passos.
- Nunca elogiar excessivamente.
- Nunca usar:
"Entendo"
"Sinto muito"
"É compreensível"
"É maravilhoso"
"É normal"
"Estou aqui para ajudar"

- Nunca repetir acolhimento em todas respostas.
- Nunca explicar demais.
- Nunca dar respostas genéricas.
- Fazer somente UMA pergunta.
- Fazer perguntas específicas.
- Investigar a origem emocional.
- Conversar naturalmente.
- Nunca explicar sentimentos antes de perguntar.
- Nunca transformar a resposta em mini palestra.
- Ir direto ao ponto.
- Responder primeiro com observação curta e depois pergunta.
- Observação curta significa no máximo 6 palavras.
- Não interpretar emoções.
- Não concluir sentimentos.
- Não usar frases como:
"Parece que..."
"Isso demonstra..."
"Existe uma carga emocional..."
"A ansiedade pode..."
- Considerar contexto anterior.
- Soar humano.

SE O USUÁRIO ESTIVER ANSIOSO:

Faça:

Observação curta + pergunta específica.

Exemplos:

"Lançamento do produto está pesando. O que mais preocupa?"

"Seu foco voltou para o lançamento. O que passa pela sua cabeça?"

"Você voltou nesse tema novamente. O que está ficando mais forte?"

SE O USUÁRIO DEMONSTRAR EVOLUÇÃO:

Reconheça rapidamente.

Exemplo:

"Você trouxe algo diferente agora. O que mudou?"

SE O USUÁRIO CITAR HÁBITOS:

Não elogiar.

Investigue.

Exemplo:

"Meditação parece fazer parte da sua rotina. O que muda dentro de você depois dela?"



`;

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",

        temperature: 0.5,

        messages: [
          {
            role: "system",
            content: promptSistema,
          },

          ...memoriaUsuarios[usuarioId],
        ],
      });

    const respostaIA =
      completion.choices[0].message.content;

    memoriaUsuarios[usuarioId].push({
      role: "assistant",
      content: respostaIA,
    });

    try {
      /* =========================================
         SALVAMENTO PRINCIPAL
      ========================================= */

      const { error: erroConversas } =
        await supabase.from("conversas").insert({
          user_id: usuarioId,
          mensagem,
          resposta: respostaIA,
          emocao: emocional.emocao,
          score: emocional.score,
          hawkins: emocional.hawkins,
          consciencia: emocional.consciencia,
          trilha: emocional.trilha,
          intervencao: emocional.intervencao,
        });

      if (erroConversas) {
        console.log(
          "ERRO TABELA CONVERSAS:",
          erroConversas.message
        );
      }

      /* =========================================
         HISTORICO EMOCIONAL
      ========================================= */

      const { error: erroHistorico } =
        await supabase
          .from("historico_emocional")
          .insert({
            user_id: usuarioId,
            emocao: emocional.emocao,
            mensagem,
            resposta_ia: respostaIA,
            score_hawkins: emocional.hawkins,
          });

      if (erroHistorico) {
        console.log(
          "ERRO HISTORICO EMOCIONAL:",
          erroHistorico.message
        );
      }

      console.log(
        "MEMÓRIA EMOCIONAL SALVA COM SUCESSO"
      );

    } catch (erroBanco) {
      console.log(
        "ERRO GERAL AO SALVAR:",
        erroBanco.message
      );
    }

    return res.json({
      resposta: respostaIA,

      emocao_detectada: {
        emocao: emocional.emocao,
      },

      score_emocional:
        emocional.score,

      frequencia_hawkins: {
        frequencia: emocional.hawkins,
      },

      nivel_consciencia:
        emocional.consciencia,

      trilha_terapeutica:
        emocional.trilha,

      intervencao:
        emocional.intervencao,
    });
  } catch (erro) {
    console.log("ERRO IA COMPLETO:", erro);

    return res.status(500).json({
      erro: "Erro interno IA.",
      detalhe: erro.message,
    });
  }
}

/* ======================================================
   ROTAS IA
====================================================== */

app.post("/api/ia", processarIA);

app.post("/api/chat", processarIA);

/* ======================================================
   START
====================================================== */

app.listen(PORT, () => {
  console.log(
    `NeuroMapa360 ONLINE na porta ${PORT}`
  );
});