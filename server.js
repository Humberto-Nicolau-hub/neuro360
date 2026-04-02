const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🧠 DETECÇÃO COMPLETA (ALINHADA COM O APP)
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  const estados = {
    ansioso: ["ansioso", "ansiedade", "nervoso", "preocupado"],
    desmotivado: ["desmotivado", "sem vontade", "desânimo"],
    sem_foco: ["sem foco", "distraído"],
    cansado: ["cansado", "esgotado", "sem energia"],
    triste: ["triste", "deprimido", "pra baixo"],
    irritado: ["irritado", "estressado", "bravo"],
    medo: ["medo", "inseguro", "receio"],
    confuso: ["confuso", "perdido"],
    sobrecarregado: ["sobrecarregado", "muita pressão"],
    procrastinando: ["procrastinando", "adiando tudo"],
    inseguro: ["inseguro", "incerteza"],
    frustrado: ["frustrado", "frustração"],
  };

  for (let estado in estados) {
    if (estados[estado].some(p => texto.includes(p))) {
      return estado;
    }
  }

  return "neutro";
}

app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    const estado = detectarEstado(mensagem);

    // 🎯 RESPOSTAS PERSONALIZADAS
    let resposta = "";
    let meta = "";
    let trilha = "";

    switch (estado) {

      case "ansioso":
        resposta = "Sua mente está acelerada. Vamos desacelerar.";
        meta = "Respiração guiada por 3 dias";
        trilha = "Controle da ansiedade";
        break;

      case "desmotivado":
        resposta = "Falta de energia para agir — vamos gerar movimento.";
        meta = "Ação de 5 minutos por 5 dias";
        trilha = "Ativação comportamental";
        break;

      case "frustrado":
        resposta = "A frustração indica expectativa não atendida. Vamos reajustar sua estratégia.";
        meta = "Reavaliar metas e dar um pequeno passo hoje";
        trilha = "Reestruturação emocional";
        break;

      case "medo":
        resposta = "O medo está te protegendo — mas também te limitando.";
        meta = "Enfrentar 1 pequeno desconforto por dia";
        trilha = "Coragem progressiva";
        break;

      case "triste":
        resposta = "A tristeza pede acolhimento, não resistência.";
        meta = "Registrar 3 coisas positivas por dia";
        trilha = "Elevação emocional";
        break;

      case "raiva":
      case "irritado":
        resposta = "Há excesso de tensão emocional. Vamos descarregar isso.";
        meta = "Respiração + pausa antes de reagir";
        trilha = "Controle emocional";
        break;

      case "confuso":
        resposta = "Sua mente está sem direção clara.";
        meta = "Definir 1 prioridade hoje";
        trilha = "Clareza mental";
        break;

      case "sobrecarregado":
        resposta = "Você está com excesso de carga mental.";
        meta = "Eliminar 1 tarefa desnecessária";
        trilha = "Gestão emocional";
        break;

      case "procrastinando":
        resposta = "Você está evitando ação.";
        meta = "Executar 1 tarefa em 5 minutos";
        trilha = "Produtividade";
        break;

      case "inseguro":
        resposta = "Falta de confiança momentânea.";
        meta = "Listar 3 conquistas suas";
        trilha = "Autoestima";
        break;

      default:
        resposta = "Vamos observar seu estado com consciência.";
        meta = "Registrar emoções por 3 dias";
        trilha = "Autoconhecimento";
    }

    const respostaFinal = `
🧠 NeuroMapa360 — IA Evolutiva

📍 Estado identificado: ${estado}

💬 ${resposta}

🎯 Meta:
${meta}

🚀 Trilha:
${trilha}

Você não é seu estado atual.
Você é o padrão que constrói.
`;

    res.json({
      resposta: respostaFinal,
      estado,
      meta,
      trilha
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
