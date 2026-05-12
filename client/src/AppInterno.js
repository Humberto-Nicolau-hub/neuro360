import React, {
  useState,
  useEffect,
  useRef,
} from "react";

export default function AppInterno({
  usuario,
  onLogout,
}) {

  /* ======================================================
     STATES
  ====================================================== */

  const [mensagem, setMensagem] =
    useState("");

  const [historico, setHistorico] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [emocaoAtiva,
    setEmocaoAtiva] =
    useState("");

  const [historicoEmocional,
    setHistoricoEmocional] =
    useState([]);

  const [estadoEmocional,
    setEstadoEmocional] =
    useState({

      score: 82,

      hawkins: 540,

      consciencia: "Expansão",

      trilha: "Reequilíbrio",

      intervencao:
        "Respiração guiada",

      emocao: "Equilibrado",
    });

  const finalChatRef =
    useRef(null);

  /* ======================================================
     EMOÇÕES RÁPIDAS
  ====================================================== */

  const emocoesRapidas = [

    {
      emoji: "🟣",
      nome: "Ansioso",
      texto:
        "Estou me sentindo ansioso hoje",
    },

    {
      emoji: "🟤",
      nome: "Cansado",
      texto:
        "Estou mentalmente cansado",
    },

    {
      emoji: "🟡",
      nome: "Confuso",
      texto:
        "Estou me sentindo confuso",
    },

    {
      emoji: "😔",
      nome: "Deprimido",
      texto:
        "Estou me sentindo deprimido",
    },

    {
      emoji: "✨",
      nome: "Esperançoso",
      texto:
        "Estou me sentindo esperançoso",
    },

    {
      emoji: "😄",
      nome: "Feliz",
      texto:
        "Hoje estou me sentindo feliz",
    },

    {
      emoji: "🟢",
      nome: "Motivado",
      texto:
        "Hoje estou me sentindo motivado",
    },

    {
      emoji: "🟠",
      nome: "Raiva",
      texto:
        "Estou com muita raiva hoje",
    },

    {
      emoji: "⚫",
      nome: "Sem foco",
      texto:
        "Estou sem foco hoje",
    },

    {
      emoji: "🔴",
      nome: "Sobrecarregado",
      texto:
        "Estou me sentindo sobrecarregado",
    },

    {
      emoji: "🔵",
      nome: "Triste",
      texto:
        "Estou me sentindo triste hoje",
    },
  ];

  /* ======================================================
     API
  ====================================================== */

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://neuro360-tkyx.onrender.com";

  /* ======================================================
     AUTO SCROLL
  ====================================================== */

  useEffect(() => {

    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [historico, loading]);

  /* ======================================================
     HORÁRIO
  ====================================================== */

  function obterHorarioAtual() {

    return new Date()
      .toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
  }

  /* ======================================================
     ENTER
  ====================================================== */

  function handleKeyDown(e) {

    if (
      e.key === "Enter" &&
      !loading
    ) {

      enviarMensagem();
    }
  }

  /* ======================================================
     COR DINÂMICA
  ====================================================== */

  function obterCorEmocional() {

    const emocao =
      estadoEmocional.emocao
        ?.toLowerCase();

    if (
      emocao?.includes("triste")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#172554,#1e3a8a)",

        card:
          "linear-gradient(90deg,#1d4ed8,#38bdf8)",
      };
    }

    if (
      emocao?.includes("ans")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#3f1d0d,#7c2d12)",

        card:
          "linear-gradient(90deg,#ea580c,#fb923c)",
      };
    }

    if (
      emocao?.includes("raiva")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#450a0a,#7f1d1d)",

        card:
          "linear-gradient(90deg,#dc2626,#f87171)",
      };
    }

    if (
      emocao?.includes("feliz")
    ) {

      return {

        sidebar:
          "linear-gradient(180deg,#064e3b,#065f46)",

        card:
          "linear-gradient(90deg,#10b981,#34d399)",
      };
    }

    return {

      sidebar:
        "linear-gradient(180deg,#0f172a,#1e293b)",

      card:
        "linear-gradient(90deg,#2563eb,#38bdf8)",
    };
  }

  const cores =
    obterCorEmocional();

  /* ======================================================
     ENVIAR
  ====================================================== */

  async function enviarMensagem() {

    if (
      !mensagem.trim() ||
      loading
    ) return;

    const horario =
      obterHorarioAtual();

    const novaMensagem = {

      tipo: "usuario",

      texto: mensagem,

      horario,
    };

    setHistorico((prev) => [
      ...prev,
      novaMensagem,
    ]);

    const textoUsuario =
      mensagem;

    setMensagem("");

    setLoading(true);

    try {

      const resposta =
        await fetch(
          `${API_URL}/ia`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              mensagem:
                textoUsuario,

              perfil:
                usuario?.premium
                  ? "premium"
                  : "terapeutico",

              user_id:
                usuario?.email ||
                "anonimo",
            }),
          }
        );

      const data =
        await resposta.json();

      const respostaIA =
        data?.resposta ||
        "Não consegui responder agora.";

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto: respostaIA,

          horario:
            obterHorarioAtual(),
        },
      ]);

      const emocaoDetectada =
        data
          ?.emocao_detectada
          ?.emocao ||
        "Equilibrado";

      setEstadoEmocional({

        score:
          data?.score_emocional || 82,

        hawkins:
          data
            ?.frequencia_hawkins
            ?.frequencia || 540,

        consciencia:
          data
            ?.nivel_consciencia ||
          "Expansão",

        trilha:
          data
            ?.trilha_terapeutica ||
          "Reequilíbrio",

        intervencao:
          data?.intervencao ||
          "Respiração guiada",

        emocao:
          emocaoDetectada,
      });

      setHistoricoEmocional(
        (prev) => [

          emocaoDetectada,

          ...prev,
        ].slice(0, 5)
      );

    } catch (erro) {

      console.error(erro);

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:
            "Erro ao conectar com IA terapêutica.",

          horario:
            obterHorarioAtual(),
        },
      ]);
    }

    setLoading(false);
  }

  /* ======================================================
     SAIR
  ====================================================== */

  function sair() {

    if (onLogout) {

      onLogout();

      return;
    }

    localStorage.clear();

    window.location.reload();
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (

    <div
      style={{

        display: "flex",

        height: "100vh",

        background:
          "linear-gradient(135deg,#020617,#0f172a,#111827)",

        color: "white",

        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* ======================================================
         SIDEBAR
      ====================================================== */}

      <div
        style={{

          width: "340px",

          background:
            cores.sidebar,

          padding: "25px",

          display: "flex",

          flexDirection: "column",

          borderRight:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 10px 40px rgba(0,0,0,0.35)",

          backdropFilter:
            "blur(14px)",

          transition:
            "all 0.5s ease",
        }}
      >

        {/* AVATAR */}

        <div
          style={{

            width: "90px",

            height: "90px",

            borderRadius: "50%",

            background:
              cores.card,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            fontSize: "38px",

            marginBottom: "20px",

            boxShadow:
              "0 0 40px rgba(56,189,248,0.4)",

            animation:
              "pulse 3s infinite",
          }}
        >
          🧠
        </div>

        <h1
          style={{

            fontSize: "52px",

            marginBottom: "10px",

            fontWeight: "bold",
          }}
        >
          Neuro360
        </h1>

        <div
          style={{

            color: "#4ade80",

            marginBottom: "25px",

            fontWeight: "bold",
          }}
        >
          IA Terapêutica Ativa ✅
        </div>

        {/* CARD STATUS */}

        <div
          style={{

            background:
              "rgba(255,255,255,0.06)",

            border:
              "1px solid rgba(255,255,255,0.08)",

            backdropFilter:
              "blur(14px)",

            borderRadius: "20px",

            padding: "22px",

            lineHeight: "2",

            boxShadow:
              "0 10px 30px rgba(0,0,0,0.2)",

            animation:
              "fadein 0.5s ease",
          }}
        >

          <div>
            🧠 Emoção:
            {" "}
            {estadoEmocional.emocao}
          </div>

          <div>
            📄 Score:
            {" "}
            {estadoEmocional.score}
          </div>

          <div>
            🔥 Hawkins:
            {" "}
            {estadoEmocional.hawkins}
          </div>

          <div>
            🌎 Consciência:
            {" "}
            {estadoEmocional.consciencia}
          </div>

          <div>
            🛤️ Trilha:
            {" "}
            {estadoEmocional.trilha}
          </div>

          <div>
            ⚡ Intervenção:
            {" "}
            {estadoEmocional.intervencao}
          </div>

          <div>
            👤 Plano:
            {" "}
            {
              usuario?.premium
                ? "Premium"
                : "Free"
            }
          </div>

        </div>

        {/* ENERGIA */}

        <div
          style={{
            marginTop: "20px",
          }}
        >

          <div
            style={{
              marginBottom: "10px",
            }}
          >
            Energia emocional
          </div>

          <div
            style={{

              width: "100%",

              height: "12px",

              background:
                "rgba(255,255,255,0.08)",

              borderRadius:
                "999px",

              overflow: "hidden",
            }}
          >

            <div
              style={{

                width:
                  `${estadoEmocional.score}%`,

                height: "100%",

                background:
                  cores.card,

                borderRadius:
                  "999px",

                transition:
                  "all 0.6s ease",

                boxShadow:
                  "0 0 20px rgba(56,189,248,0.5)",
              }}
            />

          </div>

        </div>

        {/* HISTÓRICO */}

        <div
          style={{
            marginTop: "25px",
          }}
        >

          <div
            style={{
              marginBottom: "12px",

              fontWeight: "bold",
            }}
          >
            Histórico emocional
          </div>

          <div
            style={{

              display: "flex",

              flexWrap: "wrap",

              gap: "10px",
            }}
          >

            {historicoEmocional.map(
              (emocao, index) => (

              <div
                key={index}

                style={{

                  background:
                    "rgba(255,255,255,0.08)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  padding:
                    "8px 14px",

                  borderRadius:
                    "999px",

                  fontSize: "13px",

                  backdropFilter:
                    "blur(10px)",
                }}
              >
                {emocao}
              </div>
            ))}

          </div>

        </div>

        {/* BOTÃO SAIR */}

        <button
          onClick={sair}

          style={{

            marginTop: "auto",

            background:
              "linear-gradient(90deg,#ef4444,#fb7185)",

            border: "none",

            padding: "16px",

            borderRadius:
              "14px",

            color: "white",

            fontWeight:
              "bold",

            cursor: "pointer",

            transition:
              "all 0.3s ease",

            boxShadow:
              "0 10px 25px rgba(239,68,68,0.25)",
          }}
        >
          SAIR
        </button>

      </div>

      {/* ======================================================
         CHAT
      ====================================================== */}

      <div
        style={{

          flex: 1,

          display: "flex",

          flexDirection: "column",

          padding: "30px",
        }}
      >

        {/* HISTÓRICO */}

        <div
          style={{

            flex: 1,

            overflowY: "auto",

            paddingRight: "10px",

            marginBottom: "20px",
          }}
        >

          {historico.map(
            (msg, index) => (

            <div
              key={index}

              style={{

                display: "flex",

                flexDirection:
                  "column",

                alignItems:
                  msg.tipo ===
                  "usuario"

                    ? "flex-end"

                    : "flex-start",

                marginBottom:
                  "24px",

                animation:
                  "fadein 0.5s ease",
              }}
            >

              <div
                style={{

                  maxWidth: "72%",

                  padding: "22px",

                  borderRadius:
                    "22px",

                  lineHeight: "1.8",

                  fontSize: "17px",

                  whiteSpace:
                    "pre-wrap",

                  background:
                    msg.tipo ===
                    "usuario"

                      ? "linear-gradient(90deg,#22c55e,#4ade80)"

                      : cores.card,

                  boxShadow:
                    "0 10px 35px rgba(0,0,0,0.25)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  backdropFilter:
                    "blur(10px)",

                  transition:
                    "all 0.3s ease",
                }}
              >
                {msg.texto}
              </div>

              {/* HORÁRIO */}

              <div
                style={{

                  marginTop: "6px",

                  fontSize: "12px",

                  color:
                    "rgba(255,255,255,0.5)",
                }}
              >
                {msg.horario}
              </div>

            </div>
          ))}

          {/* TYPING */}

          {loading && (

            <div
              style={{

                display: "flex",

                gap: "8px",

                paddingLeft: "10px",
              }}
            >

              {[1,2,3].map((dot) => (

                <div
                  key={dot}

                  style={{

                    width: "10px",

                    height: "10px",

                    borderRadius:
                      "50%",

                    background:
                      "#4ade80",

                    animation:
                      "pulse 1s infinite",
                  }}
                />
              ))}

            </div>
          )}

          <div ref={finalChatRef} />

        </div>

        {/* EMOÇÕES */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >

          <div
            style={{

              marginBottom: "14px",

              fontSize: "15px",

              color: "#cbd5e1",

              fontWeight: "bold",
            }}
          >
            Como você está se sentindo hoje?
          </div>

          <div
            style={{

              display: "flex",

              flexWrap: "wrap",

              gap: "12px",
            }}
          >

            {emocoesRapidas.map(
              (emocao, index) => (

              <button
                key={index}

                onClick={() => {

                  setMensagem(
                    emocao.texto
                  );

                  setEmocaoAtiva(
                    emocao.nome
                  );
                }}

                style={{

                  background:
                    emocaoAtiva ===
                    emocao.nome

                      ? cores.card

                      : "rgba(255,255,255,0.06)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  padding:
                    "12px 18px",

                  borderRadius:
                    "999px",

                  color: "white",

                  cursor: "pointer",

                  fontSize: "14px",

                  fontWeight: "bold",

                  transition:
                    "all 0.3s ease",

                  transform:
                    emocaoAtiva ===
                    emocao.nome

                      ? "scale(1.06)"

                      : "scale(1)",

                  boxShadow:
                    emocaoAtiva ===
                    emocao.nome

                      ? "0 0 30px rgba(56,189,248,0.45)"

                      : "0 8px 20px rgba(0,0,0,0.15)",

                  backdropFilter:
                    "blur(10px)",
                }}
              >

                {emocao.emoji}
                {" "}
                {emocao.nome}

              </button>
            ))}

          </div>

        </div>

        {/* INPUT */}

        <div
          style={{

            display: "flex",

            gap: "12px",
          }}
        >

          <input
            value={mensagem}

            onKeyDown={
              handleKeyDown
            }

            onChange={(e) =>
              setMensagem(
                e.target.value
              )
            }

            placeholder="Como você está se sentindo?"

            disabled={loading}

            style={{

              flex: 1,

              padding: "20px",

              borderRadius:
                "16px",

              border:
                "1px solid rgba(255,255,255,0.08)",

              background:
                "rgba(255,255,255,0.06)",

              color: "white",

              fontSize: "16px",

              outline: "none",

              backdropFilter:
                "blur(12px)",

              boxShadow:
                "0 10px 30px rgba(0,0,0,0.15)",
            }}
          />

          <button
            onClick={
              enviarMensagem
            }

            disabled={loading}

            style={{

              background:
                "linear-gradient(90deg,#22c55e,#4ade80)",

              border: "none",

              padding:
                "20px 34px",

              borderRadius:
                "16px",

              color: "white",

              fontWeight:
                "bold",

              cursor: "pointer",

              transition:
                "all 0.3s ease",

              boxShadow:
                "0 10px 30px rgba(34,197,94,0.25)",
            }}
          >
            {loading
              ? "..."
              : "Enviar"}
          </button>

        </div>

      </div>

    </div>
  );
}