import React, {
  useEffect,
  useState,
} from "react";

import { supabase } from "./supabaseClient";

export default function AdminPanel() {

  const [usuarios, setUsuarios] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    carregarUsuarios();

  }, []);

  async function carregarUsuarios() {

    try {

      setLoading(true);

      const { data, error } =
        await supabase
          .from("profiles")
          .select("*");

      if (error) {

        console.log(
          "ERRO SUPABASE:",
          error
        );

        return;
      }

      setUsuarios(data || []);

    } catch (erro) {

      console.log(
        "ERRO:",
        erro
      );

    } finally {

      setLoading(false);
    }
  }

  async function tornarPremium(email) {

    try {

      await supabase
        .from("profiles")
        .update({
          plano: "premium",
        })
        .eq("email", email);

      carregarUsuarios();

    } catch (erro) {

      console.log(
        "ERRO PREMIUM:",
        erro
      );
    }
  }

  if (loading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050816",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
        }}
      >
        Carregando painel...
      </div>
    );
  }

  return (

    <div
      style={{
        padding: 20,
        background: "#050816",
        minHeight: "100vh",
        color: "#fff",
      }}
    >

      <h2
        style={{
          marginBottom: 30,
        }}
      >
        Painel Admin
      </h2>

      {usuarios.map((u) => (

        <div
          key={u.id}

          style={{
            background: "#1e293b",
            padding: 20,
            marginBottom: 15,
            borderRadius: 12,
          }}
        >

          <p>
            <strong>Email:</strong>{" "}
            {u.email}
          </p>

          <p>
            <strong>Plano:</strong>{" "}
            {u.plano}
          </p>

          {u.plano === "free" && (

            <button
              onClick={() =>
                tornarPremium(u.email)
              }

              style={{
                background: "#00ffd5",
                border: "none",
                padding:
                  "10px 18px",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Liberar Premium
            </button>
          )}

        </div>
      ))}

    </div>
  );
}