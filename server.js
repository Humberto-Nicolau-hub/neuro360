import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

function gerarResposta(texto, emocao) {
  if (emocao === "Desmotivado") {
    return `Entendo como você está se sentindo. Às vezes a falta de motivação é apenas um sinal de que seu corpo e mente precisam de uma pausa. Que tal começar com algo pequeno hoje?`;
  }

  if (emocao === "Ansioso") {
    return `Respira fundo comigo. A ansiedade pode ser intensa, mas você não precisa resolver tudo agora. Foque em um passo de cada vez.`;
  }

  if (emocao === "Triste") {
    return `Sinto muito que você esteja se sentindo assim. Permita-se sentir, mas lembre-se: isso é passageiro. Você não está sozinho.`;
  }

  if (emocao === "Motivado") {
    return `Excelente! Aproveite esse momento de energia para avançar em algo importante para você.`;
  }

  return `Obrigado por compartilhar. Continue observando seus sentimentos e cuidando de si mesmo.`;
}

app.post("/ia", async (req, res) => {
  try {
    const { texto, emocao } = req.body;

    const resposta = gerarResposta(texto, emocao);

    res.json({ resposta });

  } catch (error) {
    console.error(error);
    res.status(500).send("Erro no servidor");
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
