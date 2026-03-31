import express from "express";
import cors from "cors";

const app = express();

// 🔥 MIDDLEWARES
app.use(cors());
app.use(express.json());

// 🚀 ROTA PRINCIPAL (TESTE)
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA COM PERFIL EMOCIONAL (FASE 2)
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem) {
      return res.status(400).json({ erro: "Mensagem vazia" });
    }

    const texto = mensagem.toLowerCase();

    // 🔍 DETECÇÃO DE PADRÃO EMOCIONAL
    let perfil = "neutro";

    if (
      texto.includes("ansioso") ||
      texto.includes("ansiedade") ||
      texto.includes("preocupado")
    ) {
      perfil = "ansiedade";
    } else if (
      texto.includes("cansado") ||
      texto.includes("esgotado") ||
      texto.includes("sem energia")
    ) {
      perfil = "fadiga";
    } else if (
      texto.includes("desmotivado") ||
      texto.includes("sem vontade") ||
      texto.includes("triste")
    ) {
      perfil = "baixa motivação";
    } else if (
      texto.includes("confuso") ||
      texto.includes("perdido") ||
      texto.includes("sem foco")
    ) {
      perfil = "falta de clareza";
    }

    // 🧠 RESPOSTA ADAPTATIVA (PNL BASE)
    let respostaIA = "";

    if (perfil === "ansiedade") {
      respostaIA = `Percebo sinais de ansiedade. Vamos reduzir o ritmo agora. Inspire profundamente por 4 segundos, segure 4 e solte em 6. Repita por 1 minuto. Você já está retomando o controle.`;
    } 
    else if (perfil === "fadiga") {
      respostaIA = `Seu corpo e mente estão pedindo recuperação. Isso não é fraqueza, é sinal de sobrecarga. Faça uma pausa consciente agora. Pequenos descansos geram grandes resultados.`;
    } 
    else if (perfil === "baixa motivação") {
      respostaIA = `Motivação não vem antes da ação. Comece pequeno: 5 minutos de ação agora. Isso quebra o ciclo e ativa seu estado interno.`;
    } 
    else if (perfil === "falta de clareza") {
      respostaIA = `Sua mente está sobrecarregada. Vamos simplificar: escolha apenas UMA prioridade agora. Clareza vem da ação focada.`;
    } 
    else {
      respostaIA = `Estou aqui com você. Me conta mais sobre o que está sentindo para eu te orientar de forma mais precisa.`;
    }

    // 📊 RESPOSTA FINAL
    res.json({
      resposta: respostaIA,
      perfil_detectado: perfil,
      usuario: email || "anonimo"
    });

  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// 🚀 PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
