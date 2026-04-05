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
  console.log("⚠️ Supabase não configurado");
}

// 🤖 OPENAI
let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log("✅ OpenAI conectado");
} else {
  console.log("⚠️ OpenAI NÃO configurado");
}

// 🧠 FALLBACK (PNL)
function respostaFallback(texto) {
  return `Eu entendo o que você está sentindo.

Mas deixa eu te perguntar algo importante:

Isso define quem você é… ou apenas o momento que você está vivendo?

Respire fundo agora.

Você tem mais controle do que imagina.

Qual é o menor passo que você pode dar hoje para mudar isso?`;
}

// 🔥 PROMPT PNL (CÉREBRO DO SISTEMA)
function gerarPromptPNL(texto, emocao) {
  return `
Você é um especialista em Programação Neurolinguística (PNL), inteligência emocional e reprogramação mental.

Objetivo:
Ajudar a pessoa a sair de estados como ansiedade, depressão e crenças limitantes.

Estado emocional: ${emocao}
Relato do usuário: ${texto}

Regras:
- Use linguagem acolhedora
- Faça reframe (ressignificação)
- Gere consciência
- Provoque reflexão
- Inclua uma pequena ação prática
- NÃO seja genérico
- NÃO seja robótico

Resposta:
`;
}

// 🔥 ROTA IA AVANÇADA
app.post("/chat", async (req, res) => {
  try {
    console.log("📩 BODY:", req.body);

    const texto = req.body.mensagem || req.body.texto;
    const emocao = req.body.emocao || "não informado";
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
        console.log("⚠️ Erro OpenAI, usando fallback:", err.message);
        resposta = respostaFallback(texto);
      }

    } else {
      resposta = respostaFallback(texto);
    }

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
        console.log("⚠️ Erro ao salvar:", dbError.message);
      }
    }

    res.json({ resposta });

  } catch (error) {
    console.error("❌ ER
