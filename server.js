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

// 🔐 AUTH
async function autenticarUsuario(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ erro: "Sem token" });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ erro: "Token inválido" });
  }

  req.user = data.user;
  next();
}

// 🧠 IA COM MEMÓRIA
app.post("/ia", autenticarUsuario, async (req, res) => {
  try {
    const { texto, emocao, score } = req.body;

    // 🔥 BUSCA HISTÓRICO (últimos 5 registros)
    const { data: historico } = await supabase
      .from("registros")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const contextoHistorico = historico
      ?.map(
        (r) =>
          `Emoção: ${r.emocao}, Texto: ${r.texto}, Score: ${r.score}`
      )
      .join("\n");

    // 🧠 PROMPT AVANÇADO
    const prompt = `
Você é um terapeuta especialista em PNL, reprogramação mental e comportamento emocional.

Seu papel:
- Acolher profundamente
- Identificar padrões emocionais
- Fazer reframe
- Gerar consciência
- Criar ação prática

Histórico recente do usuário:
${contextoHistorico || "Sem histórico"}

Situação atual:
Emoção: ${emocao}
Texto: ${texto}
Score: ${score}

Responda como terapeuta experiente.
Evite respostas genéricas.
Seja profundo, humano e transformador.
`;

    const respostaIA = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: prompt }],
          temperature: 0.7,
        }),
      }
    );

    const data = await respostaIA.json();

    const resposta = data.choices?.[0]?.message?.content;

    // 💾 SALVA
    await supabase.from("registros").insert([
      {
        user_id: req.user.id,
        emocao,
        texto,
        score,
      },
    ]);

    res.json({ resposta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro IA" });
  }
});

// 📊 DASHBOARD
app.get("/evolucao", autenticarUsuario, async (req, res) => {
  const { data } = await supabase
    .from("registros")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: true });

  res.json(data);
});

app.get("/", (req, res) => {
  res.send("NeuroMapa360 API rodando 🚀");
});

app.listen(process.env.PORT || 3001);
