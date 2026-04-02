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

// 🔍 DETECTAR ESTADO
function detectarEstado(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("ansioso")) return "ansioso";
  if (texto.includes("medo")) return "medo";
  if (texto.includes("triste")) return "triste";
  if (texto.includes("raiva")) return "raiva";
  if (texto.includes("desmotivado")) return "desmotivado";
  if (texto.includes("frustrado")) return "frustrado";

  return "neutro";
}

// 🧠 GERAR RELATÓRIO AUTOMÁTICO
function gerarRelatorio(lista) {

  if (!lista || lista.length === 0) {
    return "Você ainda não iniciou sua jornada.";
  }

  let negativos = ["ansioso","desmotivado","frustrado"];

  let qtdNegativos = lista.filter(i => negativos.includes(i.estado)).length;

  let tendencia = "Estável";

  if (qtdNegativos > lista.length / 2) {
    tendencia = "Queda";
  } else if (qtdNegativos < lista.length / 3) {
    tendencia = "Melhora";
  }

  let mensagem = "📊 Relatório Inteligente:\n\n";

  if (tendencia === "Queda") {
    mensagem += "⚠️ Você está entrando em um padrão negativo.\n";
    mensagem += "Hoje é um ponto crítico de mudança.\n";
  }

  if (tendencia === "Melhora") {
    mensagem += "📈 Você está evoluindo emocionalmente.\n";
    mensagem += "Continue reforçando esse padrão.\n";
  }

  if (tendencia === "Estável") {
    mensagem += "⚖️ Você está em estabilidade emocional.\n";
    mensagem += "Agora é hora de evoluir conscientemente.\n";
  }

  return mensagem;
}

// 🔥 CHAT
app.post("/chat", async (req, res) => {
  try {
    const { mensagem, email } = req.body;

    const estado = detectarEstado(mensagem);

    const { data: historico } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    const lista = historico || [];

    const relatorio = gerarRelatorio(lista);

    let resposta = `🧠 NeuroMapa360 — IA Ativa\n\n`;

    resposta += relatorio;

    resposta += `\n📍 Estado atual: ${estado}\n`;

    res.json({
      resposta,
      relatorio
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
});

// 🔥 ROTA RELATÓRIO DIRETO
app.post("/relatorio", async (req, res) => {
  try {
    const { email } = req.body;

    const { data } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("usuario", email);

    const relatorio = gerarRelatorio(data || []);

    res.json({ relatorio });

  } catch {
    res.status(500).json({ erro: "Erro" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Servidor rodando 🚀");
});
