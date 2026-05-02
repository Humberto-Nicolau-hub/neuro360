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

const EMOCOES = [
  "Ansioso","Triste","Feliz","Estressado",
  "Desmotivado","Deprimido","Procrastinador"
];

const MAPA = {
  Deprimido:1,Desmotivado:2,Triste:3,
  Ansioso:4,Estressado:5,Procrastinador:6,Feliz:8
};

export default function App() {

const [session, setSession] = useState(null);
const [texto, setTexto] = useState("");
const [emocao, setEmocao] = useState("Ansioso");
const [chat, setChat] = useState([]);
const [grafico, setGrafico] = useState([]);
const [plano, setPlano] = useState("free");
const [isAdmin, setIsAdmin] = useState(false);
const [interacoes, setInteracoes] = useState(0);
const [metricas, setMetricas] = useState(null);
const [loading, setLoading] = useState(false);

const chatRef = useRef(null);

const isPremium = plano === "premium" || isAdmin;

// AUTH
useEffect(()=>{
  supabase.auth.getSession().then(({data})=>{
    setSession(data.session);
  });

  supabase.auth.onAuthStateChange((_e, session)=>{
    setSession(session);
  });

},[]);

// ADMIN
useEffect(()=>{
  if(session?.user?.email === ADMIN_EMAIL){
    setIsAdmin(true);
    setPlano("premium");
  }
},[session]);

// SCROLL
useEffect(()=>{
  chatRef.current?.scrollTo({
    top: chatRef.current.scrollHeight,
    behavior:"smooth"
  });
},[chat]);

// ADMIN MÉTRICAS
const carregarMetricas = async ()=>{
  try{
    const res = await fetch(`${BACKEND_URL}/admin-metricas`);
    if(!res.ok) return;
    const data = await res.json();
    setMetricas(data);
  }catch{}
};

useEffect(()=>{
  if(isAdmin) carregarMetricas();
},[isAdmin]);

// IA
const falarComIA = async ()=>{

  if(!texto) return;

  if(!isPremium && interacoes >= MAX_FREE_INTERACOES){
    alert("Limite gratuito atingido 🚫");
    return;
  }

  setLoading(true);

  const novoChat = [...chat, {tipo:"user", texto}];
  setChat(novoChat);

  try{

    const res = await fetch(`${BACKEND_URL}/ia`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        texto,
        emocao,
        user_id: session?.user?.id,
        historico: novoChat
      })
    });

    const data = await res.json();

    const resposta = data.resposta || "Estou aqui com você.";

    setChat([...novoChat,{tipo:"ia",texto:resposta}]);

    // SALVAR REGISTRO NO BANCO
    if(session?.user?.id){
      await supabase.from("registros").insert({
        user_id: session.user.id,
        emocao,
        texto
      });
    }

    // atualizar gráfico
    const valor = MAPA[emocao] || 0;
    setGrafico(prev=>[...prev,valor]);

    setInteracoes(prev=>prev+1);

  }catch{
    setChat([...novoChat,{tipo:"ia",texto:"Erro na IA."}]);
  }

  setTexto("");
  setLoading(false);
};

// LOGIN
const login = async ()=>{
  const email = prompt("Email:");
  const password = prompt("Senha:");

  const { error } = await supabase.auth.signInWithPassword({email,password});

  if(error) alert("Login inválido");
};

const logout = async ()=>{
  await supabase.auth.signOut();
};

// UI
return(
<div style={styles.app}>

<div style={styles.sidebar}>
<h2>Neuro360</h2>

<p>Plano: {isPremium ? "Premium ✅" : "Free"}</p>

{isAdmin && <p>ADMIN 👑</p>}

<button onClick={login}>Login</button>
<button onClick={logout}>Sair</button>
</div>

<div style={styles.main}>

<div style={styles.chatBox} ref={chatRef}>
{chat.map((msg,i)=>(
<div key={i} style={{textAlign: msg.tipo==="user"?"right":"left"}}>
<div style={{
background: msg.tipo==="user"?"#22c55e":"#334155",
padding:10,
borderRadius:10,
margin:5,
display:"inline-block"
}}>
{msg.texto}
</div>
</div>
))}
</div>

<div style={styles.inputArea}>
<select value={emocao} onChange={(e)=>setEmocao(e.target.value)}>
{EMOCOES.map(e=><option key={e}>{e}</option>)}
</select>

<input
style={styles.input}
value={texto}
onChange={(e)=>setTexto(e.target.value)}
placeholder="Digite como você está..."
/>

<button onClick={falarComIA}>
{loading?"...":"Enviar"}
</button>
</div>

<EvolucaoChart dados={grafico}/>

{isAdmin && metricas && (
<div style={styles.admin}>
<h3>Painel Admin</h3>
<p>Usuários: {metricas.usuarios}</p>
<p>Registros: {metricas.registros}</p>
<p>IA: {metricas.ia}</p>
</div>
)}

</div>
</div>
);
}

const styles = {
app:{display:"flex",height:"100vh",background:"#0f172a",color:"#fff"},
sidebar:{width:220,background:"#020617",padding:20},
main:{flex:1,display:"flex",flexDirection:"column"},
chatBox:{flex:1,overflowY:"auto",padding:20},
inputArea:{position:"sticky",bottom:0,display:"flex",gap:10,padding:10,background:"#020617"},
input:{flex:1,padding:10},
admin:{padding:20}
};
