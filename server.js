const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase conectado");
} else {
  console.log("⚠️ Supabase NÃO configurado");
}

// 🤖 OPENAI
let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log("✅ OpenAI conectado");
} else {
  console.log("⚠️ OpenAI NÃO configurado (usando fallback)");
}

// 🧠 FALLBACK PNL
function respostaFallback(texto) {
  return `Eu entendo o que você está sentindo.

Mas deixa eu te perguntar algo importante:

Isso define quem você é… ou apenas o momento que você está vivendo?

Respire fundo agora.

Você tem mais controle do que imagina.

Qual é o menor passo que você pode dar hoje para mudar isso?`;
}

// 🔥 PROMPT PNL
function gerarPromptPNL(texto, emocao) {
  return `
Você é um especialista em Programação Neurolinguística (PNL), inteligência emocional e reprogramação mental.

Objetivo:
Ajudar a pessoa a sair de estados como ansiedade, depressão e crenças limitantes.

Estado emocional: ${emocao}
Relato do usuário: ${texto}

Regras:
- Linguagem acolhedora
- Fazer reframe
- Gerar consciência
- Criar pequena ação prática
- Não ser genérico

Resposta:
`;
}

// 🧠 TRILHAS PNL
const trilhas = {
  ansioso: [
    "Respire profundamente por 2 minutos focando no presente.",
    "Pergunte: isso está acontecendo agora ou é antecipação?",
    "Substitua 'e se der errado?' por 'e se der certo?'"
  ],
  desmotivado: [
    "Faça uma ação de 2 minutos agora.",
    "A ação vem antes da motivação.",
    "Você não precisa estar pronto, só precisa começar."
  ],
  triste: [
    "Permita sentir sem julgamento.",
    "O que essa emoção quer te mostrar?",
    "Faça um pequeno gesto de autocuidado hoje."
  ],
  confuso: [
    "Pare e escreva o que você realmente quer.",
    "Clareza vem com ação.",
    "Escolha um único próximo passo."
  ]
};

// 🧠 GERAR TRILHA
function gerarTrilha(emocao) {
  if (!emocao) return null;
  return trilhas[emocao.toLowerCase()] || null;
}

// 🔥 ROTA PRINCIPAL
app.post("/chat", async (req, res) => {
  try {
    console.log("📩 BODY:", req.body);

    const texto = req.body.mensagem || req.body.texto;
    const emocao = req.body.emocao || "neutro";
    const email = req.body.email || "anonimo";

    if (!texto) {
      return res.status(400).json({
        error: "Texto não enviado"
      });
    }

    let resposta = "";

    // 🤖 IA AVANÇADA
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: gerarPromptPNL(texto, emocao)
            }
          ],
          temperature: 0.7
        });

        resposta = completion.choices[0].message.content;

      } catch (err) {
        console.log("⚠️ OpenAI falhou:", err.message);
        resposta = respostaFallback(texto);
      }
    } else {
      resposta = respostaFallback(texto);
    }

    // 🧠 TRILHA
    const trilha = gerarTrilha(emocao);

    // 💾 SALVAR
    if (supabase) {
      try {
        await supabase.from("feedbacks").insert([
          {
            usuario: email,
            emocao,
            estado: texto,
            resposta
          }
        ]);
      } catch (dbError) {
        console.log("⚠️ Erro banco:", dbError.message);
      }
    }

    res.json({
      resposta,
      trilha
    });

  } catch (error) {
    console.error("❌ ERRO:", error);
    res.status(500).json({
      error: "Erro interno"
    });
  }
});

// 🔥 TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 IA + Trilhas 🚀");
});

// 🚀 START
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
