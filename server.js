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
  res.send("Neuro360 IA Comportamental 🚀");
});

app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    const texto = mensagem.toLowerCase();

    // 🔍 HISTÓRICO
    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email)
      .order("created_at", { ascending: false });

    // 🔥 STREAK REAL
    let streak = 0;

    if (historico && historico.length > 0) {
      let hoje = new Date();

      for (let i = 0; i < historico.length; i++) {
        let dataRegistro = new Date(historico[i].created_at);

        let diff = Math.floor(
          (hoje - dataRegistro) / (1000 * 60 * 60 * 24)
        );

        if (diff === i) {
          streak++;
        } else {
          break;
        }
      }
    }

    // 🔥 DETECTAR FALHA
    let falhou = false;

    if (historico && historico.length > 0) {
      let ultimo = new Date(historico[0].created_at);
      let hoje = new Date();

      let diff = Math.floor(
        (hoje - ultimo) / (1000 * 60 * 60 * 24)
      );

      if (diff > 1) falhou = true;
    }

    // 🔍 ESTADO
    let estado = "neutro";

    if (texto.includes("ansioso")) estado = "ansioso";
    else if (texto.includes("medo")) estado = "medo";
    else if (texto.includes("triste")) estado = "triste";
    else if (texto.includes("raiva")) estado = "raiva";
    else if (texto.includes("desmotivado")) estado = "desmotivado";
    else if (texto.includes("frustrado")) estado = "frustrado";

    // 🎯 META INTELIGENTE
    let meta = "Observar emoções por 3 dias";
    let trilha = "Autoconhecimento";

    if (estado === "ansioso") {
      meta = "Respirar por 3 dias";
      trilha = "Ansiedade";
    } else if (estado === "desmotivado") {
      meta = "Ação por 5 dias";
      trilha = "Produtividade";
    } else if (estado === "frustrado") {
      meta = "Reprogramar pensamentos por 3 dias";
      trilha = "Mentalidade";
    }

    // 🧠 IA COMPORTAMENTAL
    let mensagemIA = "";

    if (falhou) {
      mensagemIA += "⚠️ Você quebrou sua sequência.\n";
      mensagemIA += "Mas isso não é falha — é reinício consciente.\n\n";
    }

    if (streak > 0) {
      mensagemIA += `🔥 Você está com ${streak} dias de consistência.\n\n`;
    }

    if (estado === "ansioso") {
      mensagemIA += "Seu sistema está em alerta.\nRespire profundamente por 4 segundos.\n";
    } 
    else if (estado === "desmotivado") {
      mensagemIA += "Ação gera motivação, não o contrário.\nComece pequeno hoje.\n";
    } 
    else if (estado === "frustrado") {
      mensagemIA += "Frustração indica expectativa não atendida.\nVamos ajustar sua percepção.\n";
    } 
    else {
      mensagemIA += "Vamos manter consciência do seu estado atual.\n";
    }

    mensagemIA += `\n🎯 Meta: ${meta}`;
    mensagemIA += `\n🚀 Trilha: ${trilha}`;

    res.json({
      resposta: mensagemIA,
      meta,
      trilha,
      streak
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
