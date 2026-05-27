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
    origin: [
      "https://neuromapa360.ia.br",
      "https://neuro360-d6oobhsfl-humberto-nicolau-hubs-projects.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.options("*", cors());

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
  systemPrompt,
  premium,
  perfil
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

    const promptSistema = systemPrompt || `

Você é NeuroMapa360 IA.

Uma IA terapêutica emocional sofisticada.

Você atua como:
- terapeuta neuro sistêmico,
- especialista em PNL,
- analista emocional,
- facilitador de expansão emocional.

Seu objetivo:
- gerar profundidade emocional,
- interpretar padrões emocionais,
- provocar clareza,
- criar acolhimento real,
- conduzir microtransformações.

REGRAS:

- Nunca responda como chatbot.
- Nunca seja robótico.
- Nunca faça perguntas vazias.
- Nunca use respostas genéricas.
- Nunca faça interrogatório.

Cada resposta deve conter:

1. percepção emocional,
2. interpretação emocional,
3. micro expansão,
4. condução emocional.

A IA deve:
- soar humana,
- sofisticada,
- acolhedora,
- inteligente,
- emocionalmente profunda.

O usuário deve sentir:
- acolhimento,
- profundidade,
- vínculo emocional,
- clareza,
- evolução.

`;


    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",

        temperature: premium ? 0.95 : 0.72,

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
         MEMÓRIA TERAPÊUTICA EVOLUTIVA
      ========================================= */

      const intensidadeEmocional =
        emocional.score >= 80
          ? 10
          : emocional.score >= 60
          ? 7
          : emocional.score >= 40
          ? 5
          : 3;

      const { error: erroMemoria } =
        await supabase
          .from("memoria_emocional")
          .insert({
            user_id: usuarioId,

            mensagem_usuario: mensagem,

            resposta_ia: respostaIA,

            emocao: emocional.emocao,

            intensidade: intensidadeEmocional,

            score_emocional: emocional.score,

            nivel_hawkins: emocional.hawkins,

            trilha: emocional.trilha,
          });

      if (erroMemoria) {
        console.log(
          "ERRO MEMORIA EMOCIONAL:",
          erroMemoria.message
        );
      } else {
        console.log(
          "MEMORIA TERAPEUTICA SALVA"
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
   ASSINATURA PREMIUM
====================================================== */

app.post("/api/assinar-premium", async (req,res)=>{

try{

const { user_id } = req.body;

if(!user_id){

return res.status(400).json({
erro:"user_id obrigatório"
});

}

/* salva assinatura */

const { error:subscriptionError } =
await supabase
.from("subscriptions")
.upsert({

user_id:user_id,
plano:"PREMIUM",
status:"active"

});

if(subscriptionError){

throw subscriptionError;

}


/* salva status do usuário */

const { error:userError } =
await supabase
.from("profiles")
.update({

plano:"premium",
premium:true

})
.eq("id",user_id);

if(userError){

throw userError;

}


return res.json({

sucesso:true,
premium:true,
plano:"PREMIUM",
mensagem:"Plano PREMIUM ativado"

});

}

catch(erro){

console.log(
"ERRO PREMIUM:",
erro.message
);

return res.status(500).json({

erro:"Erro ativando premium"

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