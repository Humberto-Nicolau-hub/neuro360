const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 SUPABASE SEGURO
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// TESTE
app.get("/", (req, res) => {
  res.send("Neuro360 API rodando 🚀");
});

// 🧠 IA COM PNL + APRENDIZADO
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    if (!mensagem || !email) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const texto = mensagem.toLowerCase();

    // 🔍 BUSCAR HISTÓRICO
    const { data: historico, error } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({ erro: "Erro ao buscar histórico" });
    }

    // 🧠 APRENDIZADO
    let pontuacao = {};

    (historico || []).forEach(item => {
      if (!pontuacao[item.trilha]) {
        pontuacao[item.trilha] = 0;
      }

      pontuacao[item.trilha] += 1;

      if (item.eficaz) pontuacao[item.trilha] += 5;
      else pontuacao[item.trilha] -= 2;

      if (texto.includes(item.estado)) {
        pontuacao[item.trilha] += 3;
      }
    });

    let melhorTrilha = "Autoconhecimento";
    let maior = -Infinity;

    Object.keys(pontuacao).forEach(trilha => {
      if (pontuacao[trilha] > maior) {
        maior = pontuacao[trilha];
        melhorTrilha = trilha;
      }
    });

    // 🔍 DETECTAR ESTADO
    let estadoAtual = "neutro";

    if (texto.includes("ansioso")) estadoAtual = "ansioso";
    else if (texto.includes("desmotivado")) estadoAtual = "desmotivado";
    else if (texto.includes("confuso")) estadoAtual = "confuso";
    else if (texto.includes("cansado")) estadoAtual = "cansado";

    // 🧠 PNL PROFUNDA (INTERVENÇÃO REAL)
    let resposta = "";

    if (estadoAtual === "ansioso") {
      resposta = `
Percebo sinais de ansiedade.

Vamos fazer juntos agora:

1. Inspire profundamente por 4 segundos  
2. Segure por 4 segundos  
3. Solte lentamente por 6 segundos  

Agora imagine essa situação ficando menor, mais distante de você.

👉 O que exatamente está te deixando ansioso?

📊 Com base no seu histórico:
Recomendo a trilha: ${melhorTrilha}
`;
    }

    else if (estadoAtual === "desmotivado") {
      resposta = `
A desmotivação não vem da falta de capacidade…

Mas de excesso de carga emocional.

Feche os olhos por alguns segundos…

Imagine você concluindo uma pequena tarefa.

👉 Qual a menor ação que você pode fazer agora?

📊 Sugestão personalizada:
${melhorTrilha}
`;
    }

    else if (estadoAtual === "confuso") {
      resposta = `
Quando existe confusão, existe excesso de informação.

Vamos simplificar:

👉 Qual é a única coisa mais importante para você agora?

Clareza vem da ação focada.

📊 Trilha recomendada:
${melhorTrilha}
`;
    }

    else if (estadoAtual === "cansado") {
      resposta = `
Seu sistema está pedindo pausa — isso é inteligência, não fraqueza.

Pare por 30 segundos…

Respire…

👉 Seu cansaço é físico ou emocional?

📊 Sugestão:
${melhorTrilha}
`;
    }

    else {
      resposta = `
Estou aqui com você.

Descreva com mais detalhes o que está acontecendo.

Quanto mais clareza você traz, mais controle você ganha.

📊 Baseado no seu histórico:
${melhorTrilha}
`;
    }

    return res.json({
      resposta,
      trilha: melhorTrilha,
      estado: estadoAtual
    });

  } catch (error) {
    console.error("Erro geral:", error);
    return res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// 🚀 PORTA
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
