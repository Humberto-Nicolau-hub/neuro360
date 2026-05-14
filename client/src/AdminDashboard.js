import React from "react";

function AdminDashboard({ user = {}, onVoltar }) {
  const handleVoltar =
    typeof onVoltar === "function"
      ? onVoltar
      : () => window.history.back();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050816",
        color: "#ffffff",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              margin: 0,
              marginBottom: "10px",
            }}
          >
            Painel Administrativo
          </h1>

          <p
            style={{
              color: "#00ffd5",
              fontSize: "16px",
              margin: 0,
            }}
          >
            NeuroMapa360 • ADMIN MASTER
          </p>
        </div>

        <button
          onClick={handleVoltar}
          type="button"
          style={{
            background: "#00ffd5",
            color: "#000",
            border: "none",
            padding: "12px 24px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            boxShadow: "0 0 15px rgba(0,255,213,0.3)",
          }}
        >
          Voltar ao App
        </button>
      </div>

      {/* INFO ADMIN */}
      <div
        style={{
          background: "#11182b",
          padding: "20px",
          borderRadius: "20px",
          marginBottom: "30px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
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
          {user?.email ? user.email : "admin@neuromapa360.com"}
        </p>

        <p>
          <strong>Nível:</strong> ADMIN PREMIUM
        </p>

        <p>
          <strong>Status:</strong> MASTER ACCESS
        </p>
      </div>

      {/* CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {[
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
        ].map((card, index) => (
          <div
            key={index}
            style={{
              background: "#11182b",
              padding: "25px",
              borderRadius: "20px",
            }}
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

      {/* ÁREA FUTURA */}
      <div
        style={{
          background: "#11182b",
          borderRadius: "20px",
          padding: "30px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
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
          Este painel será responsável por toda a inteligência administrativa
          da plataforma NeuroMapa360.
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