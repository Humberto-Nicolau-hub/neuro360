import React, { useEffect, useState } from "react";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

export default function AdminDashboard() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/admin/dashboard`)
      .then(res => res.json())
      .then(data => setDados(data));
  }, []);

  if (!dados) return <p>Carregando...</p>;

  return (
    <div style={styles.container}>
      <h1>📊 Dashboard Admin</h1>

      <div style={styles.card}>
        <p>👥 Usuários: {dados.totalUsuarios}</p>
        <p>💎 Premium: {dados.premium}</p>
        <p>📊 Registros: {dados.totalRegistros}</p>
        <p>📈 Conversão: {dados.conversao}%</p>
        <p>💰 Receita: R$ {dados.receita}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 40,
    textAlign: "center",
  },
  card: {
    background: "#111",
    color: "#fff",
    padding: 30,
    borderRadius: 10,
    display: "inline-block",
    marginTop: 20,
  },
};
