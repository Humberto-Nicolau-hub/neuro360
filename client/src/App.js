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

// 🔥 CHAT
const [mensagens, setMensagens] = useState([]);
const chatRef = useRef(null);

const isPremium = plano === "premium" || isAdmin;

/* ================= SCROLL CHAT ================= */
useEffect(() => {
  chatRef.current?.scrollIntoView({ behavior: "smooth" });
}, [mensagens]);

/* ================= PAGAMENTO ================= */
useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("sucesso")) {
    alert("Pagamento aprovado! 🎉 Premium liberado.");
    buscarUsuario();
    window.history.replaceState({}, document.title, "/");
  }

  if (params.get("cancelado")) {
    alert("Pagamento cancelado.");
    window.history.replaceState({}, document.title, "/");
  }
}, []);

/* ================= AUTH ================= */
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

/* ================= USER ================= */
useEffect(() => {
  if (session?.user) {
    buscarUsuario();
    buscarRegistros();
  }
}, [session]);

const buscarUsuario = async () => {
  if (!session?.user) return;

  const emailUser = session.user.email;

  let { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", emailUser)
    .single();

  const admin = emailUser === ADMIN_EMAIL;

  if (!data) {
    const { data: novo } = await supabase
      .from("profiles")
      .insert([{ email: emailUser, plano: admin ? "premium":"free", is_admin: admin }])
      .select()
      .single();

    data = novo;
  }

  setPlano(admin ? "premium" : data?.plano || "free");
  setIsAdmin(admin || data?.is_admin || false);
};

/* ================= REGISTROS ================= */
const buscarRegistros = async () => {
  if (!session?.user) return;

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

/* ================= IA ================= */
const falarComIA = async () => {

  if (!texto) return;

  if (!isPremium && interacoes >= MAX_FREE_INTERACOES) {
    alert("Limite atingido 🚀");
    return;
  }

  // adiciona mensagem do usuário
  setMensagens(prev => [...prev, { tipo:"user", texto }]);

  setLoading(true);

  try {
    const res = await fetch(`${BACKEND_URL}/ia`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session.user.id,
        modo: modoIA
      })
    });

    const data = await res.json();

    setMensagens(prev => [
      ...prev,
      { tipo:"ia", texto: data.resposta }
    ]);

  } catch {
    setMensagens(prev => [
      ...prev,
      { tipo:"ia", texto: "Erro de conexão." }
    ]);
  }

  setTexto("");

  const novo = interacoes + 1;
  setInteracoes(novo);
  localStorage.setItem("interacoes", novo.toString());

  setLoading(false);
};

/* ================= LOGIN ================= */
const login = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert("Login inválido");
  setLoading(false);
};

const cadastrar = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signUp({ email, password });
  if (!error) setModoCadastro(false);
  setLoading(false);
};

/* ================= LOGIN UI ================= */
if (!session) {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h2>NeuroMapa360</h2>

        <input style={styles.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={styles.input} type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/>

        <button style={styles.button} onClick={modoCadastro ? cadastrar : login}>
          {loading ? "..." : modoCadastro ? "Criar Conta" : "Entrar"}
        </button>

        <p style={styles.link} onClick={()=>setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Login" : "Criar conta"}
        </p>
      </div>
    </div>
  );
}

/* ================= APP ================= */
return (
  <div style={styles.app}>

    <div style={styles.sidebar}>
      <h2>Neuro360</h2>
      <p>{isPremium ? "Premium" : "Free"}</p>
    </div>

    <div style={styles.main}>

      {/* CHAT */}
      <div style={styles.chatBox}>
        {mensagens.map((m, i) => (
          <div key={i} style={{
            ...styles.msg,
            alignSelf: m.tipo === "user" ? "flex-end" : "flex-start",
            background: m.tipo === "user" ? "#22c55e" : "#334155"
          }}>
            {m.texto}
          </div>
        ))}
        <div ref={chatRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          value={texto}
          onChange={(e)=>setTexto(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        <button style={styles.button} onClick={falarComIA}>
          {loading ? "..." : "Enviar"}
        </button>
      </div>

    </div>
  </div>
);
}

const styles = {
  app:{display:"flex",height:"100vh",background:"#0f172a",color:"#fff"},
  sidebar:{width:220,background:"#020617",padding:20},
  main:{flex:1,display:"flex",flexDirection:"column"},
  chatBox:{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:10},
  msg:{padding:12,borderRadius:10,maxWidth:"70%"},
  inputArea:{display:"flex",padding:10,gap:10},
  input:{flex:1,padding:12,borderRadius:8,border:"none"},
  button:{padding:12,borderRadius:8,border:"none",background:"#22c55e",color:"#fff",cursor:"pointer"},
  loginContainer:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"},
  loginCard:{background:"#1e293b",padding:40,borderRadius:12,display:"flex",flexDirection:"column",gap:10},
  link:{cursor:"pointer"}
};
