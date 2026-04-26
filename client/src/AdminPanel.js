import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function carregarUsuarios() {
    const { data } = await supabase
      .from("profiles")
      .select("*");

    setUsuarios(data || []);
  }

  async function tornarPremium(email) {
    await supabase
      .from("profiles")
      .update({ plano: "premium" })
      .eq("email", email);

    carregarUsuarios();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Painel Admin</h2>

      {usuarios.map((u) => (
        <div key={u.id} style={{
          background:"#1e293b",
          padding:10,
          marginBottom:10,
          borderRadius:8
        }}>
          <p>{u.email}</p>
          <p>Plano: {u.plano}</p>

          {u.plano === "free" && (
            <button onClick={() => tornarPremium(u.email)}>
              Liberar Premium
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
