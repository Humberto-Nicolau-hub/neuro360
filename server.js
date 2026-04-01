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

app.get("/", (req, res) => {
  res.send("Neuro360 IA Terapêutica 🚀");
});

// 🧠 IA COM PNL REAL
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    const texto = mensagem.toLowerCase();

    let estado = "neutro";

    if (texto.includes("ansioso")) estado = "ansioso";
    else if (texto.includes("medo")) estado = "medo";
    else if (texto.includes("triste")) estado = "triste";
    else if (texto.includes("raiva")) estado = "raiva";
    else if (texto.includes("desmotivado")) estado = "desmotivado";
    else if (texto.includes("sem foco")) estado = "sem_foco";

    // 🧠 TÉCNICAS PNL
    let tecnica = "";

    if (estado === "ansioso") {
      tecnica = `
Percebo ansiedade.

Vamos regular isso agora:

1. Inspire profundamente por 4 segundos  
2. Segure por 4 segundos  
3. Solte lentamente por 6 segundos  

Repita 3 vezes.

Agora imagine essa sensação diminuindo como um volume abaixando.
`;
    }

    else if (estado === "medo") {
      tecnica = `
Percebo medo.

Vamos trazer controle:

1. Feche os olhos por alguns segundos  
2. Imagine você em um lugar seguro  
3. Agora veja essa situação como se estivesse distante  

Você não está em perigo agora — apenas interpretando um cenário.
`;
    }

    else if (estado === "triste") {
      tecnica = `
Percebo tristeza.

Vamos mudar o estado:

1. Lembre de um momento positivo da sua vida  
2. Reviva essa sensação por alguns segundos  
3. Traga essa emoção para o presente  

Seu cérebro responde ao foco.
`;
    }

    else if (estado === "raiva") {
      tecnica = `
Percebo tensão emocional.

Vamos descarregar isso:

1. Inspire profundamente  
2. Contraia o corpo por 3 segundos  
3. Solte lentamente  

Repita algumas vezes.

Agora observe: a intensidade já diminuiu.
`;
    }

    else if (estado === "desmotivado") {
      tecnica = `
Percebo desmotivação.

Vamos ativar ação:

Faça algo extremamente simples agora:

👉 Levante  
👉 Dê 3 passos  
👉 Respire fundo  

Movimento gera mudança emocional.
`;
    }

    else if (estado === "sem_foco") {
      tecnica = `
Percebo falta de foco.

Vamos ajustar:

1. Escolha UMA tarefa pequena  
2. Execute por apenas 5 minutos  
3. Ignore todo o resto  

Foco nasce da ação, não da espera.
`;
    }

    else {
      tecnica = `
Vamos observar seu estado com curiosidade.

Sem julgamento. Apenas percepção.
`;
    }

    // 🔍 HISTÓRICO
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    let ajuste = "";

    if (historico && historico.length > 3) {
      ajuste = "\n💡 Você já está criando um padrão de evolução. Continue.";
    }

    // 🧠 RESPOSTA FINAL
    const resposta = `
🧠 NeuroMapa360 — Intervenção Inteligente

📍 Estado identificado: ${estado}

${tecnica}

${ajuste}

Você está treinando sua mente. Isso muda tudo.
`;

    res.json({ resposta });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
