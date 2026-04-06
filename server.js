import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

function gerarResposta(texto, emocao, score, tendencia) {
  if (tendencia < -1) {
    return "Percebo um padrão recente mais difícil. Vamos focar em pequenas vitórias diárias para inverter essa curva.";
  }

  if (score <= -2) {
    return "Você está em um momento sensível. Comece com algo leve hoje, sem pressão.";
  }

  if (score === -1) {
    return "Respire e desacelere. Você não precisa resolver tudo agora.";
  }

  if (score >= 1 && tendencia >= 0) {
    return "Você está evoluindo bem. Continue nesse ritmo — consistência é o segredo.";
  }

  return "Continue observando seus sentimentos. Você está no caminho.";
}

app.post("/ia", (req, res) => {
  try {
    const { texto, emocao, score, tendencia } = req.body;

    const resposta = gerarResposta(texto, emocao, score, tendencia);

    res.json({ resposta });

  } catch (error) {
    console.error(error);
    res.status(500).send("Erro no servidor");
  }
});

app.listen(3001, () => {
  console.log("Servidor rodando");
});
