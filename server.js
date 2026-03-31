import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Neuro360 backend rodando 🚀");
});

app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem) {
      return res.status(400).json({ erro: "Mensagem vazia" });
    }

    // SIMULA IA (enquanto não conecta OpenAI real)
    const respostaIA = `Olá ${email || "usuário"}, entendi que você disse: "${mensagem}". Vamos trabalhar isso com foco e clareza.`;

    res.json({ resposta: respostaIA });

  } catch (error) {
    console.error("Erro no backend:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
