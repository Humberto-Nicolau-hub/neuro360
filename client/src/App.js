// 🔥 NOVO IMPORT
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";
const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";
const MAX_FREE_INTERACOES = 3;

const EMOCOES = ["Ansioso","Triste","Feliz","Estressado","Desmotivado","Deprimido","Procrastinador"];

const MAPA = {
  Deprimido:1,
  Desmotivado:2,
  Triste:3,
  Ansioso:4,
  Estressado:5,
  Procrastinador:6,
  Feliz:8
};

export default function App() {

const [session, setSession] = useState(null);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [modoCadastro, setModoCadastro] = useState(false);
const [loading, setLoading] = useState(false);

const [texto, setTexto] = useState("");
const [emocao, setEmocao] = useState("Ansioso");
const [resposta, setResposta] = useState("");
const [grafico, setGrafico] = useState([]);

const [plano, setPlano] = useState("free");
const [isAdmin, setIsAdmin] = useState(false);
const [interacoes, setInteracoes] = useState(0);

const [metricas, setMetricas] = useState(null);
const [modoIA, setModoIA] = useState("normal");

const [chat, setChat] = useState([]);

const chatRef = useRef(null);

const isPremium = plano === "premium" || isAdmin;

/* AUTO SCROLL */
useEffect(() => {
  if (chatRef.current) {
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }
}, [chat]);

/* AUTH */
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session);
  });

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_, session) => setSession(session)
  );

  return () => listener?.subscription?.unsubscribe();
}, []);

/* RESET */
useEffect(() => {
  const hoje = new Date().toDateString();
  const ultimo = localStorage.getItem("ultimoUso");

  if (ultimo !== hoje) {
    localStorage.setItem("ultimoUso", hoje);
    localStorage.setItem("interacoes", "0");
    setInteracoes(0);
  } else {
    setInteracoes(parseInt(localStorage.getItem("interacoes") || "0"));
  }
}, []);

/* USER */
useEffect(() => {
  if (session?.user) {
    buscarUsuario();
    buscarRegistros();
  }
}, [session]);

useEffect(() => {
  if (isAdmin) carregarMetricas();
}, [isAdmin]);

const buscarUsuario = async () => {
  const user = session.user;
  const emailUser = user.email;

  if (emailUser === ADMIN_EMAIL) {
    setPlano("premium");
    setIsAdmin(true);

    await supabase.from("profiles").upsert([{
      id: user.id,
      email: emailUser,
      plano: "premium",
      is_admin: true
    }]);

    return;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    const { data: novo } = await supabase
      .from("profiles")
      .insert([{
        id: user.id,
        email: emailUser,
        plano: "free",
        is_admin: false
      }])
      .select()
      .single();

    setPlano(novo?.plano || "free");
    setIsAdmin(false);
  } else {
    setPlano(data.plano || "free");
    setIsAdmin(data.is_admin || false);
  }
};

/* REGISTROS */
const buscarRegistros = async () => {
  const { data } = await supabase
    .from("registros_emocionais")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  setGrafico(
    data?.map(d => ({
      data: new Date(d.created_at).toLocaleDateString(),
      valor: MAPA[d.emocao] || 5
    })) || []
  );
};

/* ADMIN */
const carregarMetricas = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/admin-metricas`);
    if (!res.ok) return;

    const data = await res.json();
    setMetricas(data);
  } catch {
    console.log("Erro métricas");
  }
};

/* IA */
const falarComIA = async () => {

  if (!texto) return alert("Descreva como você está.");

  if (!isPremium && interacoes >= MAX_FREE_INTERACOES) {
    alert("Limite diário atingido 🚀");
    return;
  }

  setLoading(true);

  const novoChat = [...chat, { tipo: "user", texto }];
  setChat(novoChat);

  try {
    const res = await fetch(`${BACKEND_URL}/ia`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session.user.id,
        modo: modoIA,
        historico: novoChat
      })
    });

    const data = await res.json();
    const respostaIA = data.resposta || "Estou aqui com você.";

    setChat([...novoChat, { tipo: "ia", texto: respostaIA }]);
    setResposta(respostaIA);

  } catch {
    setChat([...novoChat, { tipo: "ia", texto: "Erro, mas continuo aqui com você." }]);
  }

  const novo = interacoes + 1;
  setInteracoes(novo);
  localStorage.setItem("interacoes", novo.toString());

  await supabase.from("registros_emocionais").insert([{
    user_id: session.user.id,
    emocao,
    texto
  }]);

  buscarRegistros();
  setTexto("");
  setLoading(false);
};

/* ================= APP ================= */
return (
  <div style={styles.app}>

    <div style={styles.sidebar}>
      <h2>Neuro360</h2>

      <p style={{color:"#22c55e"}}>
        Plano: {isPremium ? "Premium ✅" : "Free"}
      </p>

      {isAdmin && <p style={{color:"#facc15"}}>ADMIN 👑</p>}
    </div>

    <div style={styles.main}>

      <div style={styles.chatContainer}>

        <div ref={chatRef} style={styles.chatBox}>
          {chat.map((msg, i) => (
            <div key={i} style={{
              textAlign: msg.tipo==="user"?"right":"left",
              marginBottom:10
            }}>
              <span style={{
                display:"inline-block",
                padding:12,
                borderRadius:12,
                maxWidth:"70%",
                background: msg.tipo==="user"?"#22c55e":"#334155"
              }}>
                {msg.texto}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.chatInputArea}>
          <input
            style={styles.input}
            value={texto}
            onChange={(e)=>setTexto(e.target.value)}
            placeholder="Digite aqui..."
          />
          <button style={styles.button} onClick={falarComIA}>
            Enviar
          </button>
        </div>

      </div>

    </div>
  </div>
);
}

/* ================= ESTILO ================= */
const styles = {
  app:{
    display:"flex",
    height:"100vh",
    overflow:"hidden",
    background:"linear-gradient(135deg,#0f172a,#1e293b)",
    color:"#fff"
  },

  sidebar:{
    width:250,
    background:"#020617",
    padding:20
  },

  main:{
    flex:1,
    display:"flex",
    flexDirection:"column",
    height:"100vh",
    overflow:"hidden"
  },

  chatContainer:{
    flex:1,
    display:"flex",
    flexDirection:"column"
  },

  chatBox:{
    flex:1,
    overflowY:"auto",
    padding:20
  },

  chatInputArea:{
    display:"flex",
    gap:10,
    padding:15,
    background:"#020617",
    position:"sticky",
    bottom:0
  },

  input:{
    flex:1,
    padding:12,
    borderRadius:8,
    border:"none",
    background:"#334155",
    color:"#fff"
  },

  button:{
    padding:12,
    borderRadius:8,
    background:"#22c55e",
    border:"none",
    color:"#fff"
  }
};
