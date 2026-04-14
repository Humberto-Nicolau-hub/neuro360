import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao, user_id } = req.body;

    console.log("BODY:", req.body);

    // 🔥 CHAMADA REAL DA IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
  {
    role: "system",
    content: `
Você é um especialista em Programação Neurolinguística (PNL), inteligência emocional e acolhimento terapêutico.

Sua missão é ajudar o usuário a compreender e regular suas emoções.

Regras da resposta:
- Seja acolhedor, humano e empático
- Nunca seja frio ou robótico
- Fale como um guia, não como um robô
- Use linguagem simples e clara
- Traga consciência emocional
- Sugira ações práticas

Estruture sempre a resposta assim:

1. Validação emocional (mostre que entende a emoção)
2. Explicação simples do que pode estar acontecendo
3. 1 ou 2 técnicas práticas (respiração, mudança de foco, PNL)
4. Fechamento encorajador

Nunca use linguagem técnica demais.
Nunca seja superficial.
Nunca dê respostas genéricas.
`,
  },
  {
    role: "user",
    content: `
Emoção: ${emocao}
Relato: ${texto}
`,
  },
],
    });

    const respostaIA = completion.choices[0].message.content;

    // 🔥 SALVA NO BANCO
    const { error } = await supabase.from("registros").insert([
      {
        user_id: user_id || null,
        emocao,
        texto,
        resposta: respostaIA,
      },
    ]);

    if (error) {
      console.error("SUPABASE ERROR:", error);
    }

    return res.json({ resposta: respostaIA });

  } catch (err) {
    console.error("ERRO:", err);
    return res.status(500).json({ erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server rodando na porta", PORT);
});
