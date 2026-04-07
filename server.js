import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 🔐 AUTH MIDDLEWARE
async function autenticarUsuario(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ erro: "Token ausente" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ erro: "Usuário inválido" });
  }

  req.user = data.user;
  next();
}

// 🚀 ROTA IA (TERAPÊUTICA REAL)
app.post("/ia", autenticarUsuario, async (req, res) => {
  try {
    const { texto, emocao } = req.body;

    if (!texto) {
      return res.json({ resposta: "⚠️ Texto vazio" });
    }

    const { data: historico } = await supabase
      .from("registros")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const contexto = historico?.map(h =>
      `Emoção: ${h.emocao}, Texto: ${h.texto}`
    ).join("\n");

    const prompt = `
Você é um terapeuta especialista em PNL e inteligência emocional.

Objetivo:
Ajudar o usuário a sair do estado atual (depressão, ansiedade, medo ou bloqueio).

Histórico:
${contexto || "Sem histórico"}

Situação atual:
Emoção: ${emocao}
Relato: ${texto}

Responda de forma:
- Profunda
- Empática
- Prática (com pequenos exercícios)
- Transformadora
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
      }),
    });

    const data = await openaiRes.json();

    console.log("OPENAI:", data);

    const resposta = data?.choices?.[0]?.message?.content;

    if (!resposta) {
      return res.json({ resposta: "⚠️ IA sem resposta" });
    }

    await supabase.from("registros").insert([
      {
        user_id: req.user.id,
        emocao,
        texto,
        score: 0,
      },
    ]);

    res.json({ resposta });

  } catch (err) {
    console.error("ERRO IA:", err);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta", PORT));
