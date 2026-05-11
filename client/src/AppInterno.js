import React, {
  useState,
  useEffect,
  useRef,
} from "react";

export default function AppInterno() {

  /* ======================================================
     STATES
  ====================================================== */

  const [mensagem, setMensagem] =
    useState("");

  const [historico, setHistorico] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

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

  const finalChatRef = useRef(null);

  /* ======================================================
     API
  ====================================================== */

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://neuro360-tkyx.onrender.com";

  /* ======================================================
     USUARIO LOGADO
  ====================================================== */

  const usuario =
    JSON.parse(
      localStorage.getItem("usuario")
    ) || {};

  /* ======================================================
     AUTO SCROLL
  ====================================================== */

  useEffect(() => {

    finalChatRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [historico, loading]);

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
     COR DINAMICA
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
          "linear-gradient(90deg,#1d4ed8,#3b82f6)",
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
          "linear-gradient(90deg,#dc2626,#ef4444)",
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
     ENVIAR MENSAGEM
  ====================================================== */

  async function enviarMensagem() {

    if (
      !mensagem.trim() ||
      loading
    ) return;

    const novaMensagem = {

      tipo: "usuario",

      texto: mensagem,
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
                "terapeutico",

              user_id:
                usuario?.email ||
                "anonimo",
            }),
          }
        );

      if (!resposta.ok) {

        throw new Error(
          "Erro servidor"
        );
      }

      const data =
        await resposta.json();

      /* =========================================
         HISTORICO
      ========================================= */

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:
            data?.resposta ||
            "Não consegui responder agora.",
        },
      ]);

      /* =========================================
         DASHBOARD DINAMICO
      ========================================= */

      setEstadoEmocional({

        score:
          data?.score_emocional ||
          82,

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
          data
            ?.emocao_detectada
            ?.emocao ||
          "Equilibrado",
      });

    } catch (erro) {

      console.error(erro);

      setHistorico((prev) => [

        ...prev,

        {
          tipo: "ia",

          texto:
            "Erro ao conectar com IA terapêutica.",
        },
      ]);
    }

    setLoading(false);
  }

  /* ======================================================
     SAIR
  ====================================================== */

  function sair() {

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
          "linear-gradient(135deg,#0f172a,#111827,#1e293b)",

        color: "white",

        fontFamily: "Arial",
      }}
    >

      {/* SIDEBAR */}

      <div
        style={{

          width: "320px",

          background:
            cores.sidebar,

          padding: "25px",

          borderRight:
            "1px solid rgba(255,255,255,0.1)",

          display: "flex",

          flexDirection: "column",

          transition:
            "all 0.5s ease",
        }}
      >

        <h1
          style={{

            fontSize: "52px",

            marginBottom: "20px",
          }}
        >
          Neuro360
        </h1>

        <div
          style={{

            color: "#4ade80",

            marginBottom: "20px",

            fontWeight: "bold",
          }}
        >
          IA Terapêutica Ativa ✅
        </div>

        <button
          style={{

            background:
              cores.card,

            border: "none",

            padding: "18px",

            borderRadius: "12px",

            color: "white",

            fontWeight: "bold",

            marginBottom: "20px",

            cursor: "pointer",

            boxShadow:
              "0 0 20px rgba(0,0,0,0.2)",
          }}
        >
          ADMIN 👑
        </button>

        {/* STATUS */}

        <div
          style={{

            marginTop: "30px",

            opacity: 0.95,

            lineHeight: "2",

            background:
              "rgba(255,255,255,0.05)",

            padding: "20px",

            borderRadius: "16px",
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

        </div>

        {/* BOTAO SAIR */}

        <button
          onClick={sair}

          style={{

            marginTop: "auto",

            background:
              "linear-gradient(90deg,#ef4444,#fb7185)",

            border: "none",

            padding: "15px",

            borderRadius: "12px",

            color: "white",

            fontWeight: "bold",

            cursor: "pointer",

            boxShadow:
              "0 0 20px rgba(0,0,0,0.2)",
          }}
        >
          SAIR
        </button>

      </div>

      {/* CHAT */}

      <div
        style={{

          flex: 1,

          display: "flex",

          flexDirection: "column",

          padding: "30px",
        }}
      >

        {/* HISTORICO */}

        <div
          style={{

            flex: 1,

            overflowY: "auto",

            marginBottom: "20px",

            paddingRight: "10px",
          }}
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

                marginBottom:
                  "20px",
              }}
            >

              <div
                style={{

                  maxWidth: "70%",

                  padding: "20px",

                  borderRadius:
                    "18px",

                  lineHeight: "1.7",

                  fontSize: "18px",

                  whiteSpace:
                    "pre-wrap",

                  boxShadow:
                    "0 0 20px rgba(0,0,0,0.2)",

                  background:
                    msg.tipo ===
                    "usuario"

                      ? "linear-gradient(90deg,#22c55e,#4ade80)"

                      : cores.card,

                  transition:
                    "all 0.5s ease",
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

                marginTop: "10px",

                fontSize: "16px",
              }}
            >
              IA analisando...
            </div>
          )}

          <div ref={finalChatRef} />

        </div>

        {/* INPUT */}

        <div
          style={{

            display: "flex",

            gap: "10px",
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

              padding: "18px",

              borderRadius:
                "12px",

              border: "none",

              background:
                "rgba(255,255,255,0.08)",

              color: "white",

              fontSize: "16px",

              outline: "none",
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
                "18px 30px",

              borderRadius:
                "12px",

              color: "white",

              fontWeight:
                "bold",

              cursor: "pointer",

              opacity:
                loading
                  ? 0.7
                  : 1,
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