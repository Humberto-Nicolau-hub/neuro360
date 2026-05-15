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

  if (!usuario) {

    return (
      <div
        style={{
          height: "100vh",
          background: "#020617",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 22,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Carregando NeuroMapa360...
      </div>
    );
  }

  /* =========================================
     AUTO SCROLL
  ========================================= */

  useEffect(() => {

    if (chatAreaRef.current) {

      setTimeout(() => {

        chatAreaRef.current.scrollTop =
          chatAreaRef.current.scrollHeight;

      }, 100);
    }

  }, [historico, loading]);

  /* =========================================
     CARREGAR HISTÓRICO
  ========================================= */

  useEffect(() => {

    carregarHistoricoEmocional();

  }, []);

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
          .limit(10);

      if (error) {

        console.log(error);
        return;
      }

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
              item.score || 50,
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
          tipo: "ia",
          texto:
            data?.resposta ||
            "Não consegui responder agora.",
        },
      ]);

    } catch (erro) {

      setHistorico((prev) => [
        ...prev,
        {
          tipo: "ia",
          texto:
            "IA temporariamente indisponível.",
        },
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

          <div>
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
            <h1>
              {estadoAtual.score}
            </h1>
          </div>

          <div style={styles.card}>
            <h3>Hawkins</h3>
            <h1>
              {estadoAtual.hawkins}
            </h1>
          </div>

          <div style={styles.card}>
            <h3>Estado</h3>
            <h1>
              {estadoAtual.emocao}
            </h1>
          </div>

        </div>

        <div style={styles.graphCard}>

          <ResponsiveContainer
            width="100%"
            height={110}
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

                  color: "#fff",

                  background: ativo
                    ? emocao.cor
                    : "transparent",

                  boxShadow: ativo
                    ? `0 0 20px ${emocao.cor}`
                    : `0 0 10px ${emocao.cor}55`,
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

            {historico.map(
              (msg, index) => (

              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.tipo ===
                    "usuario"
                      ? "flex-end"
                      : "flex-start",
                }}
              >

                <div
                  style={{
                    ...styles.msg,

                    background:
                      msg.tipo ===
                      "usuario"
                        ? "#10b981"
                        : "#111827",
                  }}
                >
                  {msg.texto}
                </div>

              </div>
            ))}

            {loading && (
              <div
                style={{
                  color: "#4ade80",
                  fontWeight: "bold",
                }}
              >
                IA analisando emoções...
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
              placeholder="Como você está se sentindo?"
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

  container: {
    display: "flex",
    height: "100vh",
    background: "#020617",
    color: "white",
    fontFamily: "Inter, sans-serif",
    overflow: "hidden",
  },

  sidebar: {
    width: 300,
    background:
      "linear-gradient(180deg,#071226,#0f172a)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    borderRight:
      "1px solid #1e293b",
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

  infoCard: {
    background:
      "rgba(17,24,39,0.85)",
    padding: 18,
    borderRadius: 20,
    lineHeight: 2,
    border:
      "1px solid #1e293b",
  },

  logout: {
    marginTop: "auto",
    height: 50,
    border: "none",
    borderRadius: 14,
    background:
      "linear-gradient(90deg,#fb7185,#f472b6)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    overflow: "hidden",
    minHeight: 0,
  },

  topCards: {
    display: "flex",
    gap: 20,
    flexShrink: 0,
  },

  card: {
    flex: 1,
    background:
      "linear-gradient(180deg,#0b1120,#111827)",
    padding: 20,
    borderRadius: 24,
    border:
      "1px solid #1e293b",
    boxShadow:
      "0 0 30px rgba(34,211,238,0.08)",
  },

  graphCard: {
    background:
      "linear-gradient(180deg,#0b1120,#111827)",
    borderRadius: 24,
    padding: 8,
    height: 140,
    minHeight: 140,
    maxHeight: 140,
    border:
      "1px solid #1e293b",
    flexShrink: 0,
    overflow: "hidden",
  },

  emocoes: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    flexShrink: 0,
  },

  emocaoBtn: {
    borderRadius: 30,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s",
    background: "transparent",
  },

  chatContainer: {
    flex: 1,
    minHeight: 0,
    height: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background:
      "linear-gradient(180deg,#0b1120,#111827)",
    borderRadius: 24,
    border:
      "1px solid #1e293b",
  },

  chatArea: {
    flex: 1,
    height: 0,
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  msg: {
    maxWidth: "70%",
    padding: 14,
    borderRadius: 18,
    lineHeight: 1.7,
  },

  inputArea: {
    display: "flex",
    gap: 12,
    padding: 20,
    borderTop:
      "1px solid #1e293b",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    border:
      "1px solid #1e293b",
    background:
      "#020617",
    color: "white",
    paddingLeft: 16,
    outline: "none",
    fontSize: 16,
  },

  send: {
    width: 140,
    border: "none",
    borderRadius: 16,
    background:
      "linear-gradient(90deg,#14b8a6,#22d3ee)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 16,
    boxShadow:
      "0 0 20px rgba(34,211,238,0.35)",
  },
};