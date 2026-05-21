import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import AdminDashboard from "./AdminDashboard";

import { supabase }
  from "./supabaseClient";

import GraficoEvolucao from "./components/GraficoEvolucao";

export default function AppInterno({
  usuario,
  onLogout,
}) {

  const [mensagem, setMensagem] =
    useState("");

  const [historico, setHistorico] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [mostrarAdmin, setMostrarAdmin] =
    useState(false);

  const [saindo, setSaindo] =
    useState(false);

  const [emocaoSelecionada,
    setEmocaoSelecionada] =
      useState("");

  const [graficoData,
    setGraficoData] =
      useState([]);

  const [historicoCompleto,
    setHistoricoCompleto] =
      useState([]);

  const [estadoAtual,
    setEstadoAtual] =
      useState({
        score: 82,
        hawkins: 540,
        consciencia: "Expansão",
        trilha: "Reequilíbrio",
        emocao: "Equilibrado",
      });

  const chatAreaRef =
useRef(null);

const carregouHistorico =
useRef(false);


  /* =========================================
     MAPA EMOCIONAL
  ========================================= */

  const mapaEmocional = {

    Ansioso: {
      score: 45,
      hawkins: 100,
      consciencia: "Sobrevivência",
      trilha: "Acalmar a mente",
    },

    Cansado: {
      score: 55,
      hawkins: 150,
      consciencia: "Recuperação",
      trilha: "Energia vital",
    },

    Confuso: {
      score: 50,
      hawkins: 180,
      consciencia: "Desorganização",
      trilha: "Clareza mental",
    },

    Deprimido: {
      score: 25,
      hawkins: 50,
      consciencia: "Contração",
      trilha: "Reconstrução emocional",
    },

    Desmotivado: {
      score: 40,
      hawkins: 125,
      consciencia: "Estagnação",
      trilha: "Ação progressiva",
    },

    Esperançoso: {
      score: 75,
      hawkins: 310,
      consciencia: "Expansão",
      trilha: "Fortalecimento emocional",
    },

    Feliz: {
      score: 90,
      hawkins: 540,
      consciencia: "Alegria",
      trilha: "Potencialização",
    },

    Motivado: {
      score: 95,
      hawkins: 600,
      consciencia: "Alta performance",
      trilha: "Execução estratégica",
    },

    Procrastinador: {
      score: 35,
      hawkins: 140,
      consciencia: "Bloqueio",
      trilha: "Produtividade emocional",
    },

    Raiva: {
      score: 30,
      hawkins: 150,
      consciencia: "Reatividade",
      trilha: "Controle emocional",
    },

    "Sem foco": {
      score: 48,
      hawkins: 170,
      consciencia: "Dispersão",
      trilha: "Foco consciente",
    },

    Triste: {
      score: 38,
      hawkins: 75,
      consciencia: "Introspecção",
      trilha: "Elevação emocional",
    },
  };

  /* =========================================
     INSIGHTS INTELIGENTES
  ========================================= */

  const emocaoPredominante =
    historicoCompleto.length
      ? historicoCompleto.reduce((acc, atual) => {

          acc[atual.emocao] =
            (acc[atual.emocao] || 0) + 1;

          return acc;

        }, {})
      : {};

  const emocaoMaisFrequente =
historicoCompleto.length > 0
? Object.keys(
emocaoPredominante
).reduce(
(a,b)=>
emocaoPredominante[a] >
emocaoPredominante[b]
? a
: b
)
: estadoAtual.emocao;

  const mediaHawkins =
    historicoCompleto.length
      ? Math.round(
          historicoCompleto.reduce(
            (acc, item) =>
              acc + (item.hawkins || 0),
            0
          ) /
          historicoCompleto.length
        )
      : estadoAtual.hawkins;

  const mediaScore =
    historicoCompleto.length
      ? Math.round(
          historicoCompleto.reduce(
            (acc, item) =>
              acc + (item.score || 0),
            0
          ) /
          historicoCompleto.length
        )
      : estadoAtual.score;

  const tendenciaEmocional =
    mediaScore >= 70
      ? "Evolução positiva"
      : mediaScore >= 50
      ? "Oscilação moderada"
      : "Momento de fortalecimento emocional";

  const estabilidadeEmocional =
    mediaHawkins >= 300
      ? "Estabilidade crescente"
      : "Processo de reorganização emocional";

  const mensagensMicroVitoria = {

  Ansioso:
    "Você observou o que sente em vez de ignorar. Essa percepção já representa avanço.",

  Cansado:
    "Seu corpo e sua mente estão enviando sinais importantes. Reconhecê-los é um passo valioso.",

  Confuso:
    "Mesmo em meio à confusão, você decidiu buscar clareza. Isso é movimento.",

  Deprimido:
    "Permitir-se continuar presente, mesmo em dias difíceis, já demonstra força.",

  Desmotivado:
    "Você identificou seu estado emocional. Isso já representa movimento.",

  Esperançoso:
    "Sua percepção emocional mostra sinais positivos de fortalecimento.",

  Feliz:
    "Valorizar momentos positivos fortalece seu equilíbrio emocional.",

  Motivado:
    "Seu padrão atual demonstra energia positiva e potencial de realização.",

  Procrastinador:
    "Reconhecer bloqueios internos é o primeiro passo para superá-los.",

  Raiva:
    "Você está percebendo sua energia emocional em vez de reagir automaticamente.",

  "Sem foco":
    "Você reconheceu sua dispersão e isso já inicia um processo de reorganização.",

  Triste:
    "Você acolheu sua emoção em vez de ignorá-la. Isso já é evolução."
};

const microVitoria =
mensagensMicroVitoria[
estadoAtual.emocao
] ||
"Pequenos avanços emocionais constroem grandes transformações.";

  const recomendacaoIA =
    mediaHawkins >= 300
      ? "Continue fortalecendo hábitos emocionais positivos."
      : "Permita-se avançar um passo de cada vez. Evolução emocional é processo.";

  useEffect(() => {

if (usuario === undefined) return;

if (!usuario) {

const timer = setTimeout(() => {
window.location="/";
},3000);

return () => clearTimeout(timer);

}

}, [usuario]);

if(usuario === undefined){

return(

<div
style={{
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#020617",
color:"#fff",
fontSize:22
}}
>

Carregando NeuroMapa360...

</div>

);

}


  /* =========================================
     AUTO SCROLL
  ========================================= */

  useEffect(()=>{

chatAreaRef.current?.scrollTo({
top:
chatAreaRef.current.scrollHeight,
behavior:"smooth"
});

},[historico.length]);

  /* =========================================
     CARREGAR HISTÓRICO
  ========================================= */

  useEffect(()=>{

if(
usuario?.id &&
!carregouHistorico.current
){

carregouHistorico.current = true;

carregarHistoricoEmocional();

}

},[usuario]);

  async function carregarHistoricoEmocional() {

    try {

      const { data, error } =
        await supabase
          .from("emocoes_historico")
          .select("*")
          .eq(
            "user_id",
            usuario?.id
          )
          .order(
            "created_at",
            { ascending: true }
          )
          .limit(20);

      if (error) {

        console.log(error);
        return;
      }

      setHistoricoCompleto(
        data || []
      );

      if (!data?.length) {

        setGraficoData([
          { dia: 1, valor: 72 },
          { dia: 2, valor: 76 },
          { dia: 3, valor: 81 },
          { dia: 4, valor: 82 },
        ]);

        return;
      }

      const formatado =
        data.map(
          (item, index) => ({
            dia: index + 1,
            valor:
              item.hawkins || 50
          })
        );

      setGraficoData(formatado);

      const ultimo =
        data[data.length - 1];

      if (
        ultimo?.emocao &&
        mapaEmocional[
          ultimo.emocao
        ]
      ) {

        const dados =
          mapaEmocional[
            ultimo.emocao
          ];

        setEstadoAtual({
          emocao:
            ultimo.emocao,
          score:
            dados.score,
          hawkins:
            dados.hawkins,
          consciencia:
            dados.consciencia,
          trilha:
            dados.trilha,
        });

        setEmocaoSelecionada(
          ultimo.emocao
        );
      }

    } catch (erro) {

      console.log(erro);
    }
  }

  /* =========================================
     ADMIN
  ========================================= */

  const isAdmin =
    usuario?.admin === true;

  const plano =
    isAdmin
      ? "ADMIN PREMIUM"
      : (
          usuario?.plano || "FREE"
        ).toUpperCase();

  /* =========================================
     LOGOUT
  ========================================= */

  async function sair() {

    if (saindo) return;

    try {

      setSaindo(true);

      localStorage.clear();

      sessionStorage.clear();

      if (onLogout) {

        await onLogout();
      }

    } catch (erro) {

      console.log(erro);

    } finally {

      window.location.href = "/";
    }
  }

  /* =========================================
     SALVAR EMOÇÃO
  ========================================= */

  async function salvarEmocao(
    emocao
  ) {

    try {

      const dados =
        mapaEmocional[
          emocao
        ];

      await supabase
        .from(
          "emocoes_historico"
        )
        .insert([
          {
            user_id:
              usuario?.id,

            emocao,

            score:
              dados.score,

            hawkins:
              dados.hawkins,
          },
        ]);

      setEstadoAtual({
        emocao,
        score:
          dados.score,
        hawkins:
          dados.hawkins,
        consciencia:
          dados.consciencia,
        trilha:
          dados.trilha,
      });

      carregarHistoricoEmocional();

    } catch (erro) {

      console.log(erro);
    }
  }

  /* =========================================
     REENQUADRAMENTO PNL
  ========================================= */

  function gerarMensagemEvolutiva(
  emocao
) {

  const mensagens = {

    Ansioso:
      "Percebo sinais de sobrecarga emocional neste momento. Ansiedade costuma surgir quando a mente tenta antecipar muitos cenários ao mesmo tempo. Vamos reduzir o ritmo e trazer foco ao presente.",

    Desmotivado:
      "Nem todo período pede aceleração. Algumas fases representam reorganização interna antes do próximo movimento.",

    Triste:
      "Reconhecer tristeza não significa fraqueza. Identificar o que sente já é um passo importante de consciência emocional.",

    Confuso:
      "Quando pensamentos competem entre si, a clareza diminui. Organizar o que realmente importa pode gerar direção.",

    Raiva:
      "Existe energia dentro dessa emoção. Direcionada corretamente, ela pode se transformar em decisão e mudança.",

    Feliz:
      "Momentos positivos fortalecem equilíbrio emocional e merecem ser valorizados.",

    Motivado:
      "Seu estado atual demonstra impulso emocional positivo e maior potencial de realização.",

    Esperançoso:
      "A esperança normalmente aparece quando algo começa a se reorganizar internamente."
  };

  return (
    mensagens[emocao] ||
    "Toda evolução emocional começa quando você observa o que sente."
  );

}
  /* =========================================
     CHAT IA
  ========================================= */

  async function enviarMensagem() {

    if (!mensagem.trim()) return;

    const texto = mensagem;

    setHistorico((prev) => [
      ...prev,
      {
        tipo: "usuario",
        texto,
      },
    ]);

    setMensagem("");

    setLoading(true);

    try {

      const response =
        await fetch(
          "https://neuro360-api.onrender.com/api/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              mensagem: texto,
              perfil: plano,
              premium:
                isAdmin ||
                usuario?.premium,
              email:
                usuario?.email,
              emocao:
                estadoAtual.emocao,
              hawkins:
                estadoAtual.hawkins,
            }),
          }
        );

      const data =
        await response.json();

      setHistorico((prev) => [
  ...prev,
  {
    tipo:"ia",
    texto:
      (
        data?.resposta ||
        gerarMensagemEvolutiva(
          estadoAtual.emocao
        )
      ) +
      "\n\nSua evolução emocional continua mesmo nos dias mais desafiadores."
  }
]);

    } finally {

      setLoading(false);
    }
  }

  /* =========================================
     ADMIN DASHBOARD
  ========================================= */

  if (
    mostrarAdmin &&
    isAdmin
  ) {

    return (
      <AdminDashboard
        user={usuario}
        onVoltar={() =>
          setMostrarAdmin(false)
        }
      />
    );
  }

  /* =========================================
     EMOÇÕES
  ========================================= */

  const emocoes = [
    {
      nome: "Ansioso",
      cor: "#f59e0b",
    },
    {
      nome: "Cansado",
      cor: "#38bdf8",
    },
    {
      nome: "Confuso",
      cor: "#06b6d4",
    },
    {
      nome: "Deprimido",
      cor: "#3b82f6",
    },
    {
      nome: "Desmotivado",
      cor: "#0ea5e9",
    },
    {
      nome: "Esperançoso",
      cor: "#14b8a6",
    },
    {
      nome: "Feliz",
      cor: "#facc15",
    },
    {
      nome: "Motivado",
      cor: "#22c55e",
    },
    {
      nome: "Procrastinador",
      cor: "#06b6d4",
    },
    {
      nome: "Raiva",
      cor: "#ec4899",
    },
    {
      nome: "Sem foco",
      cor: "#22d3ee",
    },
    {
      nome: "Triste",
      cor: "#3b82f6",
    },
  ];

  return (

    <div style={styles.container}>

      <aside style={styles.sidebar}>

        <div
          style={styles.avatar}
        />

        <h1 style={styles.logo}>
          NeuroMapa360
        </h1>

        <p style={styles.sub}>
          IA Terapêutica Ativa
        </p>

        <div style={styles.plano}>
          Plano:
          {" "}
          {plano}
        </div>

        {
          isAdmin && (
            <div style={styles.master}>
              ADMIN MASTER
            </div>
          )
        }

        {
          isAdmin && (
            <button
              onClick={() =>
                setMostrarAdmin(true)
              }
              style={styles.adminBtn}
            >
              Painel Admin
            </button>
          )
        }

        <div style={styles.infoCard}>

          <div
style={{
overflow:"hidden",
textOverflow:"ellipsis",
whiteSpace:"normal",
wordBreak:"break-word"
}}
>
👤 {usuario?.email}
</div>

          <div>
            🧠 Emoção:
            {" "}
            {estadoAtual.emocao}
          </div>

          <div>
            📊 Score:
            {" "}
            {estadoAtual.score}
          </div>

          <div>
            🔥 Hawkins:
            {" "}
            {estadoAtual.hawkins}
          </div>

          <div>
            🌐 Consciência:
            {" "}
            {estadoAtual.consciencia}
          </div>

          <div>
            🛤️ Trilha:
            {" "}
            {estadoAtual.trilha}
          </div>

        </div>

        <button
          onClick={sair}
          style={styles.logout}
        >
          {
            saindo
              ? "Saindo..."
              : "Sair"
          }
        </button>

      </aside>

      <main style={styles.main}>

        <div style={styles.topCards}>

          <div style={styles.card}>
   <h3>Score</h3>
   <h1 style={{
      fontSize:36,
      marginTop:5
   }}>
      {estadoAtual.score}
   </h1>
</div>

          <div style={styles.card}>
   <h3>Hawkins</h3>
   <h1 style={{
      fontSize:36,
      marginTop:5
   }}>
      {estadoAtual.hawkins}
   </h1>
</div>

          <div style={styles.card}>
   <h3>Estado</h3>
   <h1 style={{
      fontSize:36,
      marginTop:5
   }}>
      {estadoAtual.emocao}
   </h1>
</div>
     </div>

      <div style={styles.insightsGrid}>
<div style={styles.insightCard}>
     

<h4>
Emoção predominante
</h4>

<p>
{emocaoMaisFrequente}
</p>

</div>

          <div style={styles.insightCard}>
            <h4>
              Tendência emocional
            </h4>
            <p>
              {tendenciaEmocional}
            </p>
          </div>

          <div style={styles.insightCard}>
            <h4>
              Estabilidade emocional
            </h4>
            <p>
              {estabilidadeEmocional}
            </p>
          </div>

          <div style={styles.insightCard}>
            <h4>
              Microvitória
            </h4>
            <p>
              {microVitoria}
            </p>
          </div>

        </div>

        <div style={styles.recomendacaoCard}>

<h3
style={{
margin:"0",
fontSize:18
}}
>
Insight evolutivo IA
</h3>

<p
style={{
margin:"2px 0",

fontSize:13,

lineHeight:"20px",

whiteSpace:"normal",

overflow:"visible"
}}
>
{recomendacaoIA}
</p>

<div
style={{
fontSize:12,
color:"#22d3ee",
fontWeight:"bold"
}}
>
Média Hawkins: {mediaHawkins}
</div>

</div>

        <div style={styles.graphCard}>

          <ResponsiveContainer
            width="100%"
            height={40}
          >

            <LineChart
              data={graficoData}
            >

              <CartesianGrid
                stroke="#1e293b"
              />

              <XAxis
                dataKey="dia"
                stroke="#64748b"
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="valor"
                stroke="#22d3ee"
                strokeWidth={4}
                dot={{
                  r: 6,
                  fill: "#22d3ee",
                }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>
                <div
style={{
display:"flex",
justifyContent:"space-between",
fontSize:11,
opacity:.7,
padding:"0 10px",
marginTop:-4,
marginBottom:10
}}
>

<span>Contração</span>
<span>Transição</span>
<span>Expansão</span>

</div>

<div
style={{
height:65,
overflow:"hidden",
flexShrink:0
}}
>
<GraficoEvolucao
historico={historicoCompleto}
/>
</div>

<h3
style={{
marginBottom:10,
marginTop:6
}}
>
Selecione seu estado emocional
</h3>
        

        <div style={styles.emocoes}>

          {emocoes.map((emocao) => {

            const ativo =
              emocaoSelecionada ===
              emocao.nome;

            return (

              <button
                key={emocao.nome}

                onClick={async () => {

                  setEmocaoSelecionada(
                    emocao.nome
                  );

                  setMensagem(
                    `Estou me sentindo ${emocao.nome}`
                  );

                  await salvarEmocao(
                    emocao.nome
                  );
                }}

                style={{
                  ...styles.emocaoBtn,

                  border:
                    `2px solid ${emocao.cor}`,

                  background: ativo
? `linear-gradient(
90deg,
${emocao.cor},
${emocao.cor}dd
)`
: "transparent",

color: ativo
? "#081018"
: "#ffffff",

boxShadow: ativo
? `0 0 25px ${emocao.cor}`
: `0 0 10px ${emocao.cor}55`,

transform: ativo
? "scale(1.05)"
: "scale(1)",

fontWeight:
ativo
? 700
: 500,
                }}
              >
                {emocao.nome}
              </button>
            );
          })}

        </div>

        <div style={styles.chatContainer}>

          <div
            ref={chatAreaRef}
            style={styles.chatArea}
          >

            {
historico.length===0 ? (

<div style={styles.estadoVazio}>

<h3
style={{
color:"#22d3ee",
marginBottom:12
}}
>
IA Terapêutica pronta
</h3>

<p
style={{
opacity:.8,
lineHeight:1.7
}}
>
Escolha um estado emocional acima ou escreva como está se sentindo para iniciar sua jornada emocional.
</p>

</div>

) : (

historico.map(
(msg,index)=>(

<div
key={index}
style={{
display:"flex",
justifyContent:
msg.tipo==="usuario"
? "flex-end"
: "flex-start",
}}
>

<div
style={{
...styles.msg,

background:
msg.tipo==="usuario"
? "#10b981"
: "#111827",
}}
>

{msg.texto}

</div>

</div>

))
)
}
              

            {loading && (
              <div
                style={{
                  color: "#4ade80",
                  fontWeight: "bold",
                }}
              >
                IA analisando seu contexto emocional...
              </div>
            )}

          </div>

          <div style={styles.inputArea}>

            <input
              value={mensagem}
              onChange={(e) =>
                setMensagem(
                  e.target.value
                )
              }
              placeholder="Compartilhe como você está se sentindo..."
              style={styles.input}
            />

            <button
              onClick={
                enviarMensagem
              }
              style={styles.send}
            >
              Enviar
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

const styles = {

  container:{
   display:"flex",

   width:"100%",

   height:"100vh",

   background:"#020617",

   color:"white",

   fontFamily:"Inter,sans-serif",

   overflow:"hidden",
},

  sidebar:{
width:"260px",
flexShrink:0,
   background:"linear-gradient(180deg,#071226,#0f172a)",
   padding:24,
   display:"flex",
   flexDirection:"column",
   gap:18,
   borderRight:"1px solid #1e293b",
   height:"100vh",

overflow:"hidden",
},

  avatar: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background:
      "linear-gradient(90deg,#22d3ee,#67e8f9)",
    boxShadow:
      "0 0 25px #22d3ee",
  },

  logo: {
    fontSize: 28,
    fontWeight: "bold",
  },

  sub: {
    color: "#4ade80",
    fontWeight: "bold",
  },

  plano: {
    color: "#facc15",
    fontWeight: "bold",
  },

  master: {
    background:
      "linear-gradient(90deg,#facc15,#f59e0b)",
    color: "#111827",
    padding: "10px 14px",
    borderRadius: 30,
    fontWeight: "bold",
    textAlign: "center",
    boxShadow:
      "0 0 20px rgba(250,204,21,0.4)",
  },

  adminBtn: {
    border: "none",
    background:
      "linear-gradient(90deg,#facc15,#f59e0b)",
    color: "#111827",
    fontWeight: "bold",
    padding: "14px",
    borderRadius: 14,
    cursor: "pointer",
    boxShadow:
      "0 0 20px rgba(250,204,21,0.35)",
  },

  infoCard:{
   background:"rgba(17,24,39,0.85)",
   padding:12,
   borderRadius:20,
   lineHeight:1.6,
   border:"1px solid #1e293b",

   overflow:"hidden",
   wordBreak:"break-word",
},

  logout:{
marginTop:"auto",

marginBottom:10,

width:"100%",

height:44,

border:"none",

borderRadius:14,

background:
"linear-gradient(90deg,#fb7185,#f472b6)",

color:"white",

fontWeight:"bold",

cursor:"pointer",

flexShrink:0,
},

  main:{
   flex:1,

   padding:"10px 16px",

   display:"flex",

   flexDirection:"column",

   height:"100vh",

   minHeight:0,

   overflowY:"auto",

   overflowX:"hidden",

   gap:6,
},

  topCards:{
   display:"grid",
   gridTemplateColumns:"repeat(3,minmax(150px,1fr))",
   gap:12,
},

  card:{
   flex:1,
   background:
   "linear-gradient(180deg,#0b1120,#111827)",
   padding:6,
minHeight:60,
   borderRadius:18,
   border:"1px solid #1e293b",
   boxShadow:"0 0 30px rgba(34,211,238,0.08)"
},

  insightsGrid: {
  display:"grid",
  gridTemplateColumns:"repeat(4,minmax(150px,1fr))",
  gap:10,
  flexShrink:0,
},

  insightCard: {
  background:
    "linear-gradient(180deg,#111827,#0f172a)",
  padding:6,
  borderRadius:12,
  minHeight:30,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
},

  recomendacaoCard:{
background:
"linear-gradient(90deg,#0f172a,#111827)",

padding:"6px 10px",

borderRadius:18,

minHeight:48,

maxHeight:48,

   overflow:"hidden",

   flexShrink:0,
},

  hawkinsInfo: {
    marginTop: 10,
    color: "#22d3ee",
    fontWeight: "bold",
  },

  graphCard:{
background:
"linear-gradient(180deg,#0b1120,#111827)",
borderRadius:20,
padding:1,

height:34,
minHeight:34,
maxHeight:34,

border:"1px solid #1e293b",
flexShrink:0,
overflow:"hidden",
},

  emocoes:{
display:"flex",
gap:6,
flexWrap:"wrap",
flexShrink:0,

marginBottom:1,

overflow:"visible",
},

  emocaoBtn:{

borderRadius:30,

padding:"4px 10px",

cursor:"pointer",

fontWeight:"bold",

fontSize:13,

minWidth:70,

whiteSpace:"nowrap",

transition:"0.3s",

background:"transparent",

flexShrink:1,

},

  chatContainer:{
   flex:1,

   display:"flex",

   flexDirection:"column",

   minHeight:180,

   maxHeight:180,

   overflow:"hidden",

   background:
   "linear-gradient(180deg,#0b1120,#111827)",

   borderRadius:24,

   border:"1px solid #1e293b",

   marginTop:2,

   flexShrink:0,
},

  chatArea:{
   flex:1,

   padding:12,

   display:"flex",

   flexDirection:"column",

   gap:14,

   overflowY:"auto",

   overflowX:"hidden",

   minHeight:0,

   scrollbarWidth:"thin",
},
estadoVazio:{
display:"flex",

flexDirection:"column",

justifyContent:"center",

alignItems:"center",

height:"100%",

padding:"4px 20px",

textAlign:"center",

borderRadius:18,

background:"rgba(255,255,255,.03)",

minHeight:50,
},
  msg:{

maxWidth:"75%",

padding:"14px 18px",

borderRadius:18,

lineHeight:1.7,

whiteSpace:"pre-wrap",

fontSize:14,

wordBreak:"break-word",

overflow:"visible",

boxShadow:
"0 0 20px rgba(0,0,0,0.25)",

transition:
"all .3s ease",
},
    inputArea:{
display:"flex",

alignItems:"center",

gap:8,

padding:"8px",

borderTop:"1px solid #1e293b",

minHeight:55,

flexShrink:0,
},

  input:{
flex:1,

minWidth:0,

height:38,

borderRadius:16,

border:"1px solid #1e293b",

background:"#020617",

color:"white",

paddingLeft:16,

outline:"none",

fontSize:16,
},

  send:{
width:110,

height:38,

border:"none",

borderRadius:16,

background:
"linear-gradient(90deg,#14b8a6,#22d3ee)",

color:"white",

fontWeight:700,

fontSize:14,

cursor:"pointer",

transition:"0.3s",

boxShadow:
"0 0 25px rgba(34,211,238,0.4)"
},
};