import React from "react";

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#050816",
    color: "#ffffff",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    overflowX: "hidden",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: {
    fontSize: "36px",
    fontWeight: "bold",
    margin: 0,
    marginBottom: "10px",
  },

  subtitle: {
    color: "#00ffd5",
    fontSize: "16px",
    margin: 0,
  },

  button: {
    background: "#00ffd5",
    color: "#000",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    boxShadow: "0 0 15px rgba(0,255,213,0.3)",
  },

  card: {
    background: "#11182b",
    padding: "25px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  section: {
    background: "#11182b",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "30px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
};

function AdminDashboard(props) {
  const user = props?.user || {};

  const handleVoltar =
    typeof props?.onVoltar === "function"
      ? props.onVoltar
      : () => window.history.back();

  const cards = [
    {
      titulo: "Usuários",
      valor: "0",
      texto: "Total cadastrados",
    },
    {
      titulo: "Premium",
      valor: "0",
      texto: "Usuários premium",
    },
    {
      titulo: "Admins",
      valor: "1",
      texto: "Administradores",
    },
    {
      titulo: "IA Ativa",
      valor: "100%",
      texto: "Sistema operacional",
    },
  ];

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Painel Administrativo
          </h1>

          <p style={styles.subtitle}>
            NeuroMapa360 • ADMIN MASTER
          </p>
        </div>

        <button
          type="button"
          onClick={handleVoltar}
          style={styles.button}
        >
          Voltar ao App
        </button>
      </div>

      {/* ADMIN */}
      <div style={styles.section}>
        <h2
          style={{
            marginTop: 0,
            marginBottom: "15px",
            color: "#00ffd5",
          }}
        >
          Administrador Logado
        </h2>

        <p>
          <strong>Email:</strong>{" "}
          {user.email || "admin@neuromapa360.com"}
        </p>

        <p>
          <strong>Nível:</strong> ADMIN PREMIUM
        </p>

        <p>
          <strong>Status:</strong> MASTER ACCESS
        </p>
      </div>

      {/* CARDS */}
      <div style={styles.grid}>
        {cards.map((card, index) => (
          <div
            key={`card-${index}`}
            style={styles.card}
          >
            <h3
              style={{
                color: "#00ffd5",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              {card.titulo}
            </h3>

            <h1
              style={{
                fontSize: "42px",
                margin: 0,
              }}
            >
              {card.valor}
            </h1>

            <p
              style={{
                opacity: 0.7,
                marginTop: "10px",
              }}
            >
              {card.texto}
            </p>
          </div>
        ))}
      </div>

      {/* CONTEÚDO */}
      <div style={styles.section}>
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#00ffd5",
          }}
        >
          Gestão Inteligente NeuroMapa360
        </h2>

        <p
          style={{
            lineHeight: "1.8",
            opacity: 0.85,
          }}
        >
          Este painel será responsável por toda a inteligência
          administrativa da plataforma NeuroMapa360.
        </p>

        <p
          style={{
            marginTop: "20px",
            lineHeight: "1.8",
            opacity: 0.85,
          }}
        >
          Próximos módulos:
        </p>

        <ul
          style={{
            marginTop: "20px",
            lineHeight: "2",
            opacity: 0.9,
            paddingLeft: "20px",
          }}
        >
          <li>✔ Gestão de usuários</li>
          <li>✔ Controle FREE / PREMIUM</li>
          <li>✔ Promoção para ADMIN</li>
          <li>✔ Estatísticas emocionais</li>
          <li>✔ Logs de IA</li>
          <li>✔ Monitoramento comportamental</li>
          <li>✔ Dashboard financeiro</li>
          <li>✔ Analytics terapêutico</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;