import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

function gerarResposta(texto, emocao, score) {
  if (score <= -2) {
    return "Percebo que você está em um momento mais difícil. Vamos dar um passo pequeno hoje, algo leve, só para começar a mudar esse estado.";
  }

  if (score === -1) {
    return "Você parece um pouco sobrecarregado. Que tal desacelerar e focar em uma coisa de cada vez?";
  }

  if (score === 0) {
    return "Você está em um estado neutro. Esse é um ótimo ponto para escolher uma direção positiva.";
  }

  if (score >= 1) {
    return "Excelente energia! Aproveite esse momento para avançar com força em algo importante.";
  }

  return "Continue observando seus sentimentos e evoluindo.";
}

app.post("/ia", (req, res) => {
  try {
    const { texto, emocao, score } = req.body;

    const resposta = gerarResposta(texto, emocao, score);

    res.json({ resposta });

  } catch (error) {
    console.error(error);
    res.status(500).send("Erro no servidor");
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando");
});
