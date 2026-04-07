import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 MIDDLEWARE AUTENTICAÇÃO
async function autenticarUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ erro: "Token não enviado" });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ erro: "Token inválido" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("Erro autenticação:", err);
    res.status(500).json({ erro: "Erro interno auth" });
  }
}

// 🧠 ROTA IA TERAPÊUTICA
app.post("/ia", autenticarUsuario, async (req, res) => {
  try {
    const { texto, emocao, score } = req.body;

    if (!texto) {
      return res.status(400).json({ erro: "Texto é obrigatório" });
    }

    const prompt = `
Você é um terapeuta especializado em Programação Neurolinguística (PNL), neurociência e reprogramação mental.

Seu papel NÃO é dar respostas genéricas.

Você deve:

1. Acolher emocionalmente o usuário
2. Validar o sentimento dele
3. Identificar possível padrão mental limitante
4. Fazer um REFRAME (mudança de percepção)
5. Fazer 1 ou 2 perguntas poderosas
6. Sugerir uma ação prática imediata
7. Finalizar com encorajamento

Contexto do usuário:
Emoção: ${emocao || "não informado"}
Score emocional: ${score || 0}
Relato: "${texto}"

Responda de forma humana, profunda, empática e transformadora.

Evite respostas curtas.
Evite frases genéricas.
Seja terapêutico.
`;

    const respostaIA = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await respostaIA.json();

    const resposta = data.choices?.[0]?.message?.content;

    // 💾 SALVA NO SUPABASE (histórico)
    await supabase.from("registros").insert([
      {
        user_id: req.user.id,
        emocao,
        texto,
        score,
      },
    ]);

    res.json({ resposta });

  } catch (error) {
    console.error("Erro IA:", error);
    res.status(500).json({ erro: "Erro na IA" });
  }
});

// 🔥 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("🔥 NeuroMapa360 API rodando");
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
