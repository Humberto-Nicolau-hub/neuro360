import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/**
 * 🔐 Middleware de autenticação Supabase
 */
async function autenticarUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ erro: "Token não enviado" });
    }

    const token = authHeader.replace("Bearer ", "");

    const response = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.SUPABASE_ANON_KEY,
        },
      }
    );

    const user = await response.json();

    if (!user || user.error) {
      return res.status(401).json({ erro: "Usuário inválido" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Erro na autenticação:", err);
    res.status(500).json({ erro: "Erro na autenticação" });
  }
}

/**
 * 🧠 ROTA IA (CORRETA)
 */
app.post("/ia", autenticarUsuario, async (req, res) => {
  try {
    console.log("🔥 BATEU NA ROTA /ia");

    const { texto } = req.body;

    if (!texto) {
      return res.status(400).json({ resposta: "Digite algo..." });
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
              content:
                "Você é um assistente terapêutico baseado em PNL, acolhedor e positivo.",
            },
            {
              role: "user",
              content: texto,
            },
          ],
        }),
      }
    );

    const data = await openaiResponse.json();

    console.log("🤖 RESPOSTA OPENAI:", data);

    const resposta =
      data.choices?.[0]?.message?.content ||
      "Não consegui gerar resposta.";

    res.json({ resposta });
  } catch (err) {
    console.error("❌ ERRO NA IA:", err);
    res.status(500).json({ resposta: "Erro interno na IA" });
  }
});

/**
 * 🌐 ROTA TESTE
 */
app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

/**
 * 🚀 START SERVER
 */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
