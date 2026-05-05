// 🔥 IMPORTS (MANTIDO)
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import EvolucaoChart from "./EvolucaoChart";

const supabase = createClient(
  "https://qodzwxgabuadsnplcscl.supabase.co",
  "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K"
);

const BACKEND_URL = "https://backend-neuro360.onrender.com";

const ADMIN_EMAIL = "contatobetaoofertas@gmail.com";

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
const [grafico, setGrafico] = useState([]);

const [plano, setPlano] = useState("free");
const [isAdmin, setIsAdmin] = useState(false);
const [metricas, setMetricas] = useState(null);

const [chat, setChat] = useState([]);
const [modo, setModo] = useState("terapeutico");
const [modoProfundo, setModoProfundo] = useState(false);

const chatRef = useRef(null);

const isPremium = plano === "premium" || isAdmin;

/* ================= SCROLL ================= */
useEffect(() => {
  chatRef.current?.scrollTo({
    top: chatRef.current.scrollHeight,
    behavior: "smooth"
  });
}, [chat, loading]);

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

/* ================= USER ================= */
useEffect(() => {
  if (session?.user) {
    buscarUsuario();
    buscarRegistros();

    if (session.user.email === ADMIN_EMAIL) {
      setIsAdmin(true);
      carregarMetricas();
    }
  }
}, [session]);

const buscarUsuario = async () => {
  try {
    const emailUser = session.user.email;
    const admin = emailUser === ADMIN_EMAIL;

    let { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", emailUser)
      .maybeSingle();

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

  } catch (e) {
    console.log("Erro usuário:", e.message);
  }
};

/* ================= ADMIN ================= */
const carregarMetricas = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/admin-metricas`);
    if (!res.ok) throw new Error("Erro backend");

    const data = await res.json();
    setMetricas(data);

  } catch (e) {
    console.log("Erro métricas:", e.message);
  }
};

/* ================= REGISTROS ================= */
const buscarRegistros = async () => {
  try {
    const { data } = await supabase
      .from("registros_emocionais")
      .select("*")
      .eq("user_id", session.user.id);

    setGrafico(
      data?.map(d => ({
        data: new Date(d.created_at).toLocaleDateString(),
        valor: MAPA[d.emocao] || 5
      })) || []
    );

  } catch (e) {
    console.log("Erro registros:", e.message);
  }
};

/* ================= LOGOUT ================= */
const logout = async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};

/* ================= IA ================= */
const falarComIA = async () => {
  if (!texto || loading) return;
  if (!session?.user?.id) return alert("Sessão inválida");

  const novoChat = [...chat, { tipo: "user", texto }];
  setChat(novoChat);
  setTexto("");
  setLoading(true);

  try {
    const res = await fetch(`${BACKEND_URL}/ia`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session.user.id,
        modo,
        modoProfundo
      })
    });

    if (!res.ok) throw new Error("Erro servidor");

    const data = await res.json();

    const respostaIA = data?.resposta || "Estou aqui com você.";

    setChat([...novoChat, { tipo:"ia", texto: respostaIA }]);

  } catch (e) {
    console.log("Erro IA:", e.message);

    setChat([
      ...novoChat,
      {
        tipo:"ia",
        texto:"⚠️ Tive uma instabilidade, mas continuo com você. Tente novamente."
      }
    ]);
  }

  setLoading(false);
};

/* ================= LOGIN ================= */
const login = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert("Erro login");
  setLoading(false);
};

/* ================= REGISTER ================= */
const register = async () => {
  setLoading(true);
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert("Erro ao cadastrar");
  else alert("Conta criada! Faça login.");
  setModoCadastro(false);
  setLoading(false);
};

/* ================= UI LOGIN ================= */
if (!session) {
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <h2 style={{textAlign:"center"}}>NeuroMapa360</h2>

        <input style={styles.input} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={styles.input} type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)}/>

        <button style={styles.button} onClick={modoCadastro ? register : login}>
          {loading ? "Carregando..." : modoCadastro ? "Criar Conta" : "Entrar"}
        </button>

        <p style={{color:"#38bdf8", cursor:"pointer", textAlign:"center"}}
          onClick={()=>setModoCadastro(!modoCadastro)}
        >
          {modoCadastro ? "Já tenho conta" : "Criar conta"}
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

      <p style={{color:"#22c55e"}}>
        Plano: {isPremium ? "Premium ✅" : "Free"}
      </p>

      {isAdmin && (
        <>
          <p style={{color:"#facc15", marginTop:10}}>ADMIN 👑</p>
          <div style={styles.adminBox}>
            <p>Usuários: {metricas?.usuarios || 0}</p>
            <p>Registros: {metricas?.registros || 0}</p>
            <p>IA: {metricas?.ia || 0}</p>
          </div>
        </>
      )}

      <button onClick={()=>setModo("normal")} style={{...styles.modeBtn, background: modo === "normal" ? "#22c55e" : "#334155"}}>Normal</button>

      <button onClick={()=>setModo("terapeutico")} style={{...styles.modeBtn, background: modo === "terapeutico" ? "#22c55e" : "#334155"}}>Terapêutico</button>

      <button onClick={()=>setModoProfundo(!modoProfundo)} style={{...styles.modeBtn, background: modoProfundo ? "#22c55e" : "#334155"}}>
        🧠 Terapia Guiada {modoProfundo ? "ON" : "OFF"}
      </button>

      <a href="https://wa.me/5561993338458" target="_blank" rel="noreferrer" style={styles.support}>
        💬 Suporte
      </a>

      <button onClick={logout} style={styles.logout}>Sair</button>
    </div>

    <div style={styles.main}>
      <div ref={chatRef} style={styles.chatBox}>
        {chat.map((msg, i) => (
          <div key={i} style={{
            ...styles.bubble,
            alignSelf: msg.tipo === "user" ? "flex-end" : "flex-start",
            background: msg.tipo === "user" ? "#22c55e" : "#334155"
          }}>
            {msg.texto}
          </div>
        ))}

        {loading && (
          <div style={{...styles.bubble, background:"#334155"}}>
            IA está digitando...
          </div>
        )}
      </div>

      <div style={styles.inputBar}>
        <select value={emocao} onChange={e=>setEmocao(e.target.value)}>
          {EMOCOES.map(e => <option key={e}>{e}</option>)}
        </select>

        <input value={texto} onChange={(e)=>setTexto(e.target.value)} />
        <button onClick={falarComIA}>Enviar</button>
      </div>

      {grafico.length > 0 && <EvolucaoChart data={grafico}/>}
    </div>
  </div>
);
}

/* ================= STYLES ================= */

const styles = {
  app:{display:"flex",height:"100vh",background:"#0f172a",color:"#fff"},
  sidebar:{width:220,background:"#020617",padding:20},
  main:{flex:1,display:"flex",flexDirection:"column"},
  chatBox:{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:10},
  bubble:{padding:12,borderRadius:10,maxWidth:"60%"},
  inputBar:{display:"flex",gap:10,padding:10,background:"#1e293b"},
  logout:{marginTop:20,background:"#ef4444",padding:10,borderRadius:5,color:"#fff"},
  support:{marginTop:15,color:"#38bdf8"},
  button:{padding:12,background:"#22c55e",borderRadius:6,color:"#fff",border:"none"},
  input:{padding:10,borderRadius:6,border:"none"},
  loginContainer:{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#0f172a"},
  loginCard:{background:"#1e293b",padding:30,borderRadius:10,display:"flex",flexDirection:"column",gap:10,width:320},
  modeBtn:{marginTop:10,width:"100%",padding:10,color:"#fff",border:"none",borderRadius:6,cursor:"pointer"},
  adminBox:{marginTop:10,background:"#020617",padding:10,borderRadius:8}
};
