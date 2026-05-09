import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import AdminDashboard from "./AdminDashboard";

/* ======================================================
   API
====================================================== */

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://backend-neuro360.onrender.com";

/* ======================================================
   APP
====================================================== */

export default function App() {

  const [mensagem, setMensagem] =
    useState("");

  const [chat, setChat] =
    useState([]);

  const [emocao, setEmocao] =
    useState("ansiedade");

  const [
    modoTerapeutico,
    setModoTerapeutico,
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  const [
    mostrarAdmin,
    setMostrarAdmin,
  ] = useState(false);

  const [
    scoreEmocional,
    setScoreEmocional,
  ] = useState(0);

  const [
    frequenciaAtual,
    setFrequenciaAtual,
  ] = useState(0);

  const [
    conscienciaAtual,
    setConscienciaAtual,
  ] = useState("");

  const [
    trilhaAtual,
    setTrilhaAtual,
  ] = useState("");

  const [
    protocoloAtual,
    setProtocoloAtual,
  ] = useState("");

  const [
    intervencaoAtual,
    setIntervencaoAtual,
  ] = useState("");

  const mensagensRef =
    useRef(null);

  const userIdRef = useRef(
    localStorage.getItem(
      "neuro_user_id"
    ) || crypto.randomUUID()
  );

  /* ======================================================
     STORAGE
  ====================================================== */

  useEffect(() => {

    localStorage.setItem(
      "neuro_user_id",
      userIdRef.current
    );

  }, []);

  /* ======================================================
     SCROLL
  ====================================================== */

  useEffect(() => {

    mensagensRef.current?.scrollTo({
      top:
        mensagensRef.current
          .scrollHeight,

      behavior: "smooth",
    });

  }, [chat]);

  /* ======================================================
     ENVIAR MENSAGEM
  ====================================================== */

  async function enviarMensagem() {

    if (!mensagem.trim()) {
      return;
    }

    const mensagemUsuario =
      mensagem;

    setChat((prev) => [
      ...prev,
      {
        tipo: "usuario",
        texto: mensagemUsuario,
      },
    ]);

    setMensagem("");

    setLoading(true);

    try {

      const response =
        await fetch(
          `${API_URL}/ia`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              user_id:
                userIdRef.current,

              mensagem:
                mensagemUsuario,

              emocao,

              terapeutico:
                modoTerapeutico,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro na API"
        );
      }

      const data =
        await response.json();

      console.log(
        "NEURO360 RESPONSE:",
        data
      );

      /* =========================================
         DASHBOARD ESTADO
      ========================================= */

      setScoreEmocional(
        data?.score_emocional || 0
      );

      setFrequenciaAtual(
        data
          ?.frequencia_hawkins
          ?.frequencia || 0
      );

      setConscienciaAtual(
        data
          ?.frequencia_hawkins
          ?.nivel || ""
      );

      setTrilhaAtual(
        data
          ?.trilha_terapeutica || ""
      );

      setProtocoloAtual(
        data
          ?.protocolo_pnl || ""
      );

      setIntervencaoAtual(
        data?.intervencao || ""
      );

      /* =========================================
         CHAT IA
      ========================================= */

      setChat((prev) => [
        ...prev,

        {
          tipo: "ia",

          texto:
            data?.resposta ||
            "Sem resposta.",

          hawkins:
            data
              ?.frequencia_hawkins
              ?.frequencia,

          nivel:
            data
              ?.frequencia_hawkins
              ?.nivel,

          score:
            data
              ?.score_emocional,

          protocolo:
            data
              ?.protocolo_pnl,

          intervencao:
            data
              ?.intervencao,

          trilha:
            data
              ?.trilha_terapeutica,

          memoria:
            data
              ?.memoria_ativa,
        },
      ]);

    } catch (err) {

      console.error(
        "ERRO IA:",
        err
      );

      setChat((prev) => [
        ...prev,

        {
          tipo: "ia",

          texto:
            "Erro ao conectar com a IA terapêutica.",
        },
      ]);

    } finally {

      setLoading(false);
    }
  }

  /* ======================================================
     ADMIN
  ====================================================== */

  if (mostrarAdmin) {

    return (
      <AdminDashboard
        voltar={() =>
          setMostrarAdmin(false)
        }
      />
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div style={styles.app}>

      <aside style={styles.sidebar}>

        <h1 style={styles.logo}>
          Neuro360
        </h1>

        <p style={styles.premium}>
          IA Terapêutica Ativa ✅
        </p>

        <button
          style={styles.admin}
          onClick={() =>
            setMostrarAdmin(true)
          }
        >
          ADMIN 👑
        </button>

        <div style={styles.box}>

          <strong>
            Terapia Guiada
          </strong>

          <button
            style={{
              ...styles.toggle,

              background:
                modoTerapeutico
                  ? "#22c55e"
                  : "#334155",
            }}
            onClick={() =>
              setModoTerapeutico(
                !modoTerapeutico
              )
            }
          >
            {modoTerapeutico
              ? "ON"
              : "OFF"}
          </button>
        </div>

        <div style={styles.metrics}>

          <h3>
            🧠 Estado Cognitivo
          </h3>

          <p>
            📈 Score:
            {" "}
            {scoreEmocional}
          </p>

          <p>
            🔥 Hawkins:
            {" "}
            {frequenciaAtual}
          </p>

          <p>
            🌎 Consciência:
            {" "}
            {conscienciaAtual}
          </p>

          <p>
            🛤️ Trilha:
            {" "}
            {trilhaAtual}
          </p>

          <p>
            🧩 Protocolo:
            {" "}
            {protocoloAtual}
          </p>

          <p>
            ⚡ Intervenção:
            {" "}
            {intervencaoAtual}
          </p>

        </div>

      </aside>

      <main style={styles.main}>

        <div
          style={styles.chat}
          ref={mensagensRef}
        >

          {chat.map((msg, i) => (

            <div
              key={i}
              style={
                msg.tipo ===
                "usuario"
                  ? styles.userBubble
                  : styles.aiBubble
              }
            >

              <p>{msg.texto}</p>

              {msg.hawkins && (

                <div
                  style={styles.infoBox}
                >

                  🔥 Hawkins:
                  {" "}
                  {msg.hawkins}
                  {" "}
                  Hz

                  <br />

                  🧠 Consciência:
                  {" "}
                  {msg.nivel}

                  <br />

                  📈 Score:
                  {" "}
                  {msg.score}

                </div>
              )}

              {msg.protocolo && (

                <div
                  style={
                    styles.protocolBox
                  }
                >

                  🧩 Protocolo:
                  <br />
                  {msg.protocolo}

                </div>
              )}

              {msg.intervencao && (

                <div
                  style={
                    styles.interventionBox
                  }
                >

                  ⚡ Intervenção:
                  <br />
                  {msg.intervencao}

                </div>
              )}

              {msg.trilha && (

                <div
                  style={styles.trilhaBox}
                >

                  🛤️ Trilha:
                  <br />
                  {msg.trilha}

                </div>
              )}

            </div>
          ))}

          {loading && (

            <div style={styles.aiBubble}>
              IA analisando emoções...
            </div>
          )}

        </div>

        <div style={styles.controls}>

          <select
            value={emocao}
            onChange={(e) =>
              setEmocao(
                e.target.value
              )
            }
            style={styles.select}
          >

            <option value="ansiedade">
              Ansiedade
            </option>

            <option value="tristeza">
              Tristeza
            </option>

            <option value="culpa">
              Culpa
            </option>

            <option value="raiva">
              Raiva
            </option>

            <option value="procrastinacao">
              Procrastinação
            </option>

          </select>

          <input
            style={styles.input}
            value={mensagem}
            onChange={(e) =>
              setMensagem(
                e.target.value
              )
            }
            placeholder="Como você está se sentindo?"
            onKeyDown={(e) => {

              if (e.key === "Enter") {
                enviarMensagem();
              }
            }}
          />

          <button
            style={styles.send}
            onClick={enviarMensagem}
          >
            Enviar
          </button>

        </div>

      </main>

    </div>
  );
}

/* ======================================================
   STYLES
====================================================== */

const styles = {

  app: {
    display: "flex",
    background: "#020617",
    color: "#fff",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "Arial",
  },

  sidebar: {
    width: 320,
    background: "#0f172a",
    padding: 20,
    borderRight:
      "1px solid #1e293b",
    overflowY: "auto",
  },

  logo: {
    fontSize: 34,
    marginBottom: 10,
  },

  premium: {
    color: "#4ade80",
    marginBottom: 20,
  },

  admin: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    marginBottom: 20,
    fontWeight: "bold",
  },

  box: {
    marginBottom: 25,
  },

  toggle: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    color: "#fff",
    marginTop: 10,
    cursor: "pointer",
    fontWeight: "bold",
  },

  metrics: {
    background: "#111827",
    padding: 20,
    borderRadius: 14,
    marginTop: 20,
    lineHeight: 1.9,
    fontSize: 14,
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  chat: {
    flex: 1,
    overflowY: "auto",
    padding: 25,
  },

  userBubble: {
    background: "#22c55e",
    color: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    marginLeft: "auto",
    maxWidth: "70%",
    lineHeight: 1.6,
  },

  aiBubble: {
    background: "#1e3a8a",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    maxWidth: "75%",
    lineHeight: 1.7,
  },

  infoBox: {
    marginTop: 15,
    background: "#0f172a",
    padding: 12,
    borderRadius: 10,
    color: "#4ade80",
    fontSize: 14,
  },

  protocolBox: {
    marginTop: 12,
    background: "#312e81",
    padding: 12,
    borderRadius: 10,
  },

  interventionBox: {
    marginTop: 12,
    background: "#7c2d12",
    padding: 12,
    borderRadius: 10,
  },

  trilhaBox: {
    marginTop: 12,
    background: "#14532d",
    padding: 12,
    borderRadius: 10,
  },

  controls: {
    display: "flex",
    gap: 10,
    padding: 20,
    borderTop:
      "1px solid #1e293b",
    background: "#0f172a",
  },

  select: {
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "#1e293b",
    color: "#fff",
  },

  input: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "#1e293b",
    color: "#fff",
  },

  send: {
    padding: "14px 24px",
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
