import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

async function gerarRespostaGPT(texto, emocao, score, tendencia) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `
Você é um assistente terapêutico especializado em Programação Neurolinguística (PNL).
Seu papel é ajudar emocionalmente o usuário com empatia, clareza e orientação prática.

Regras:
- Seja acolhedor
- Use linguagem simples
- Ofereça um pequeno passo prático
- Nunca seja técnico demais
`,
          },
          {
            role: "user",
            content: `
Emoção atual: ${emocao}
Score atual: ${score}
Tendência emocional: ${tendencia}

Usuário disse: ${texto}

Responda de forma personalizada.
`,
          },
        ],
      }),
    });

    const data = await response.json();

    return (
      data.choices?.[0]?.message?.content ||
      "Não consegui gerar resposta no momento."
    );
  } catch (error) {
    console.error("Erro OpenAI:", error);
    return "Erro ao conectar com IA.";
  }
}

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, score, tendencia } = req.body;

    const resposta = await gerarRespostaGPT(
      texto,
      emocao,
      score,
      tendencia
    );

    res.json({ resposta });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro no servidor");
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando com GPT 🚀");
});
