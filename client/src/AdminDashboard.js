import React from "react";

export default function AdminDashboard({ user, onVoltar }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        color: "white",
        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Painel Administrativo
          </h1>

          <p
            style={{
              color: "#00ffd5",
              fontSize: "16px",
            }}
          >
            NeuroMapa360 • ADMIN MASTER
          </p>
        </div>

        <button
          onClick={onVoltar}
          style={{
            background: "#00ffd5",
            color: "#000",
            border: "none",
            padding: "12px 24px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
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
            marginBottom: "15px",
            color: "#00ffd5",
          }}
        >
          Administrador Logado
        </h2>

        <p>
          <strong>Email:</strong> {user?.email}
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
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "#11182b",
            padding: "25px",
            borderRadius: "20px",
          }}
        >
          <h3
            style={{
              color: "#00ffd5",
              marginBottom: "10px",
            }}
          >
            Usuários
          </h3>

          <h1 style={{ fontSize: "42px" }}>0</h1>

          <p style={{ opacity: 0.7 }}>
            Total cadastrados
          </p>
        </div>

        <div
          style={{
            background: "#11182b",
            padding: "25px",
            borderRadius: "20px",
          }}
        >
          <h3
            style={{
              color: "#00ffd5",
              marginBottom: "10px",
            }}
          >
            Premium
          </h3>

          <h1 style={{ fontSize: "42px" }}>0</h1>

          <p style={{ opacity: 0.7 }}>
            Usuários premium
          </p>
        </div>

        <div
          style={{
            background: "#11182b",
            padding: "25px",
            borderRadius: "20px",
          }}
        >
          <h3
            style={{
              color: "#00ffd5",
              marginBottom: "10px",
            }}
          >
            Admins
          </h3>

          <h1 style={{ fontSize: "42px" }}>1</h1>

          <p style={{ opacity: 0.7 }}>
            Administradores
          </p>
        </div>

        <div
          style={{
            background: "#11182b",
            padding: "25px",
            borderRadius: "20px",
          }}
        >
          <h3
            style={{
              color: "#00ffd5",
              marginBottom: "10px",
            }}
          >
            IA Ativa
          </h3>

          <h1 style={{ fontSize: "42px" }}>100%</h1>

          <p style={{ opacity: 0.7 }}>
            Sistema operacional
          </p>
        </div>
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

        <br />

        <p
          style={{
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