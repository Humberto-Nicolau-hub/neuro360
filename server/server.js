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

app.use(cors({
  origin: [
  "https://neuromapa360.ia.br",
  "https://neuro360-e2w1e97qo-humberto-nicolau-hubs-projects.vercel.app",
  "https://neuro360-dhgob3ao7-humberto-nicolau-hubs-projects.vercel.app",
  "https://neuro360-p25dsw0ng-humberto-nicolau-hubs-projects.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
],

  methods: ["GET", "POST", "PUT", "DELETE"],

  credentials: true
}));

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

async function gerarPerfilEmocional(userId) {

  try {

    const { data: historico, error } =
      await supabase
        .from("memoria_emocional")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

    if (error || !historico) {
      console.log("Erro ao carregar histórico emocional");
      return null;
    }

    let ansiedade = 0;
    let tristeza = 0;
    let motivacao = 0;
    let raiva = 0;
    let confusao = 0;

    historico.forEach((item) => {

      const emocao =
        (item.emocao || "").toLowerCase();

      if (emocao.includes("ans")) ansiedade++;
      if (emocao.includes("tris")) tristeza++;
      if (emocao.includes("motiv")) motivacao++;
      if (emocao.includes("raiva")) raiva++;
      if (emocao.includes("conf")) confusao++;

    });

    const mapa = {
      ansiedade,
      tristeza,
      motivacao,
      raiva,
      confusao
    };

    const dominante =
      Object.keys(mapa).reduce((a, b) =>
        mapa[a] > mapa[b] ? a : b
      );

    const scoreEmocional =
      (motivacao * 10) -
      (ansiedade * 5) -
      (tristeza * 4);

    const scoreEvolucao =
      Math.max(0, 100 + scoreEmocional);

    let perfilTerapeutico =
      "equilibrado";

    if (dominante === "ansiedade") {
      perfilTerapeutico =
        "acolhedor_calmo";
    }

    if (dominante === "tristeza") {
      perfilTerapeutico =
        "emocional_profundo";
    }

    if (dominante === "motivacao") {
      perfilTerapeutico =
        "expansivo_acao";
    }

    await supabase
      .from("perfil_emocional_usuario")
      .upsert({

        user_id: userId,

        emocao_dominante: dominante,

        nivel_ansiedade: ansiedade,
        nivel_tristeza: tristeza,
        nivel_motivacao: motivacao,
        nivel_raiva: raiva,
        nivel_confusao: confusao,

        score_emocional: scoreEmocional,
        score_evolucao: scoreEvolucao,

        perfil_terapeutico: perfilTerapeutico,

        atualizado_em: new Date()

      });

    return {
      dominante,
      scoreEmocional,
      scoreEvolucao,
      perfilTerapeutico
    };

  } catch (err) {

    console.log(
      "ERRO PERFIL EMOCIONAL:",
      err.message
    );

    return null;
  }
}

/* ======================================================
   ANALISE LONGITUDINAL
====================================================== */

async function gerarAnaliseLongitudinal(userId) {

  try {

    const { data: historico, error } =
      await supabase
        .from("memoria_emocional")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);

    if (error || !historico || historico.length === 0) {

      return {
        emocaoDominante: "indefinida",
        mediaHawkins: 0,
        tendencia: "neutra",
        estabilidade: "desconhecida",
        riscoRecaida: false,
        scoreEvolucao: 0,
        resumo: "Sem dados suficientes"
      };

    }

    let somaHawkins = 0;

    let ansiedade = 0;
    let tristeza = 0;
    let motivacao = 0;
    let raiva = 0;

    historico.forEach((item) => {

      const hawkinsAtual =
Number(item.nivel_hawkins || 0);

somaHawkins += hawkinsAtual;

      const emocao =
        (item.emocao || "").toLowerCase();

      if (emocao.includes("ans")) ansiedade++;
      if (emocao.includes("tris")) tristeza++;
      if (emocao.includes("evol")) motivacao++;
      if (emocao.includes("raiva")) raiva++;

    });

    const mediaHawkins =
historico.length > 0
? Math.round(somaHawkins / historico.length)
: 0;

    const mapa = {
      ansiedade,
      tristeza,
      motivacao,
      raiva
    };

    const emocaoDominante =
      Object.keys(mapa).reduce((a, b) =>
        mapa[a] > mapa[b] ? a : b
      );

    let tendencia = "neutra";

    if (mediaHawkins >= 400) {
      tendencia = "evolucao_positiva";
    }

    if (mediaHawkins < 200) {
      tendencia = "instabilidade_emocional";
    }

    let estabilidade = "moderada";

    if (
      ansiedade >= 5 ||
      tristeza >= 5
    ) {
      estabilidade = "baixa";
    }

    if (
      motivacao >= 5
    ) {
      estabilidade = "alta";
    }

    const riscoRecaida =
      ansiedade >= 6 ||
      tristeza >= 6;

    const scoreEvolucao =
Number(mediaHawkins || 0);

    const resumo =
`
O usuário apresenta predominância emocional em ${emocaoDominante}.
A média Hawkins atual é ${mediaHawkins}.
A tendência emocional identificada é ${tendencia}.
O nível de estabilidade emocional é ${estabilidade}.
`;

    /* =========================================
       SALVAR ANALISE LONGITUDINAL
    ========================================= */

    await supabase
      .from("analise_longitudinal")
      .insert({

        user_id: userId,

        emocao_dominante: emocaoDominante,

        media_hawkins: mediaHawkins,

        tendencia: tendencia,

        estabilidade: estabilidade,

        risco_recaida: riscoRecaida,

        score_evolucao: scoreEvolucao,

        resumo_longitudinal: resumo

      });

    return {

      emocaoDominante,

      mediaHawkins,

      tendencia,

      estabilidade,

      riscoRecaida,

      scoreEvolucao,

      resumo

    };

  } catch (err) {

    console.log(
      "ERRO ANALISE LONGITUDINAL:",
      err.message
    );

    return null;
  }
}

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

    console.log("BODY RECEBIDO:", req.body);
console.log("USER_ID RECEBIDO:", user_id);

    const usuarioId = user_id || "anonimo";

    const { data: profile } =
await supabase
.from("profiles")
.select("plano,premium,admin")
.eq("id", usuarioId)
.single();

const usuarioPremium =
profile?.premium === true;

const usuarioAdmin =
profile?.admin === true;

const planoUsuario =
(profile?.plano || "free")
.toLowerCase();

    const emocional =
      analisarEstadoEmocional(mensagem);

      /* =========================================
| MEMÓRIA TERAPÊUTICA EVOLUTIVA
========================================= */

const { data: memoriaRecente } =
await supabase
.from("memoria_emocional")
.select("*")
.eq("user_id", usuarioId)
.order("created_at", { ascending: false })
.limit(5);

let contextoMemoria = "";

if (memoriaRecente && memoriaRecente.length > 0) {

contextoMemoria =
`
HISTÓRICO EMOCIONAL RECENTE DO USUÁRIO:

${memoriaRecente.map((m) => `
- Emoção: ${m.emocao}
- Usuário disse: ${m.mensagem_usuario}
- IA respondeu: ${m.resposta_ia}
`).join("\n")}
`;

}

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

      const analiseLongitudinal =
  await gerarAnaliseLongitudinal(usuarioId);

    const promptSistema = systemPrompt || `

Você é a IA terapêutica oficial do NeuroMapa360.

Seu papel é oferecer:
- acolhimento emocional;
- escuta terapêutica;
- apoio emocional;
- clareza mental;
- evolução emocional;
- reflexão profunda;
- orientação emocional leve.

IMPORTANTE:
Nunca seja agressiva.
Nunca julgue.
Nunca responda friamente.
Nunca dê respostas genéricas.

O usuário possui o seguinte perfil emocional:

Emoção dominante:
${perfilEmocional?.dominante || "indefinida"}

Perfil terapêutico:
${perfilEmocional?.perfilTerapeutico || "equilibrado"}

Score emocional:
${perfilEmocional?.scoreEmocional || 0}

Score evolutivo:
${perfilEmocional?.scoreEvolucao || 0}

MEMÓRIA TERAPÊUTICA:
A IA deve lembrar naturalmente das emoções anteriores do usuário e conectar os contextos emocionais durante a conversa.

ANÁLISE LONGITUDINAL:

Emoção predominante:
${analiseLongitudinal?.emocaoDominante || "indefinida"}

Média Hawkins:
${analiseLongitudinal?.mediaHawkins || 0}

Tendência emocional:
${analiseLongitudinal?.tendencia || "neutra"}

Estabilidade emocional:
${analiseLongitudinal?.estabilidade || "moderada"}

Risco de recaída:
${analiseLongitudinal?.riscoRecaida ? "SIM" : "NÃO"}

Resumo emocional:
${analiseLongitudinal?.resumo || ""}

Se o perfil for:
- acolhedor_calmo:
responda com suavidade, grounding, segurança emocional e desaceleração mental.

- emocional_profundo:
responda com profundidade emocional, acolhimento e reflexão interna.

- expansivo_acao:
responda incentivando avanço, clareza, ação e fortalecimento.

A IA deve agir como uma terapeuta emocional evolutiva moderna, humana e acolhedora.


`;



    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",

        temperature:
(usuarioPremium || usuarioAdmin)
? 0.95
: 0.72,

        messages: [
          {
role: "system",
content:
promptSistema + "\n\n" + contextoMemoria
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

        await supabase.from("evolucao_emocional").insert({
  user_id: usuarioId,

  emocao: emocional.emocao,
  score: emocional.score,
  hawkins: emocional.hawkins,
  consciencia: emocional.consciencia,

  resumo_ia: respostaIA,
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

app.post("/api/criar-checkout-premium", async (req,res)=>{

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
   CRIAR PLANO PREMIUM MERCADO PAGO
====================================================== */

import { MercadoPagoConfig } from "mercadopago";

const mpClient =
new MercadoPagoConfig({

accessToken:
process.env.MERCADOPAGO_ACCESS_TOKEN

});

app.post(
"/api/criar-plano-premium",
async (req,res)=>{

try{

const response =
await fetch(
"https://api.mercadopago.com/preapproval_plan",
{
method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":
`Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
},

body:JSON.stringify({

reason:
"NeuroMapa360 Premium",

auto_recurring:{

frequency:1,

frequency_type:"months",

transaction_amount:29.90,

currency_id:"BRL"

},

back_url:
`${process.env.FRONTEND_URL}`

})

}
);

const data =
await response.json();

console.log(
"PLANO CRIADO:",
data
);

return res.json(data);

}
catch(error){

console.log(
"ERRO PLANO:",
error
);

return res.status(500).json({

erro:
"Erro ao criar plano"

});

}

});

app.post(
"/api/mercadopago/webhook",
async (req,res)=>{

try{

  console.log("HEADERS:");
console.log(req.headers);

console.log("BODY:");
console.log(JSON.stringify(req.body, null, 2));

console.log(
"WEBHOOK MP:",
JSON.stringify(req.body)
);

console.log(
"BODY COMPLETO:",
JSON.stringify(
req.body,
null,
2
)
);

console.log(
"QUERY:",
JSON.stringify(
req.query,
null,
2
)
);

const data =
req.body?.data?.id ||
req.query?.id;

const type =
req.body?.type ||
req.query?.topic;

console.log(
"TIPO RECEBIDO:",
type
);

if (
type !== "subscription_preapproval" &&
type !== "preapproval" &&
type !== "payment"
){
return res.sendStatus(200);
}

const response =
await fetch(
`https://api.mercadopago.com/preapproval/${data}`,
{
headers:{
Authorization:
`Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
}
}
);

const subscription =
await response.json();

console.log(
"ASSINATURA:",
subscription
);

const email =
subscription?.payer_email;

if(!email){

return res.sendStatus(200);

}

await supabase
.from("subscriptions")
.update({

status:
subscription.status,

mercadopago_subscription_id:
subscription.id

})
.eq("email",email);

if(
subscription.status ===
"authorized"
){

await supabase
.from("profiles")
.update({

premium:true,

plano:"premium"

})
.eq("email",email);

}

return res.sendStatus(200);

}
catch(error){

console.log(
"ERRO WEBHOOK:",
error
);

return res.sendStatus(500);

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