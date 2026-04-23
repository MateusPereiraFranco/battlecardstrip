"use client";
import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// SVGs inline para não dependermos de bibliotecas externas para as logos
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Componente reutilizável para os campos de formulário com design Neon
const NeonInput = ({ label, type, placeholder, required = false, minLength }: any) => (
  <div className="flex flex-col gap-1 mb-4 w-full">
    <label className="text-cyan-400 text-xs font-bold uppercase tracking-widest ml-1 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      className="bg-transparent border border-cyan-600 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all bg-white/5"
    />
  </div>
);

// A regra diz que o componente principal exportado deve ser App para o preview funcionar.
// No seu projeto, você pode renomear para `export default function Login()`
export default function App() {
  // Estado que controla se mostramos o Login ou o Cadastro
  const [isLogin, setIsLogin] = useState(true);

  // Variantes de animação para o Framer Motion
  const formVariants: Variants = {
    hidden: { opacity: 0, x: isLogin ? -50 : 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: isLogin ? 50 : -50, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black font-sans">
      
      {/* 1. FUNDO ESPACIAL (Sci-Fi Background) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Nebulosa Roxa e Azul usando radiais do Tailwind */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-900/40 via-black to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-transparent to-transparent"></div>
        
        {/* Simulação de "Cacos de Vidro" voando no fundo com Framer Motion */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", // Forma poligonal aleatória
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* 2. O PAINEL DE VIDRO (Glassmorphism Container) */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col items-center">
        
        {/* Título Neon */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] uppercase tracking-widest">
            Cosmic Cards
          </h1>
        </div>

        {/* 3. ÁREA DE TRANSIÇÃO DOS FORMULÁRIOS */}
        <div className="w-full relative min-h-[350px]">
          <AnimatePresence mode="wait">
            {isLogin ? (
              
              // === FORMULÁRIO DE LOGIN ===
              <motion.form
                key="login"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col w-full"
                onSubmit={(e) => { e.preventDefault(); alert("Login simulação!"); }}
              >
                <NeonInput label="Email" type="email" placeholder="player@email.com" required />
                <NeonInput label="Password" type="password" placeholder="••••••••" required />

                {/* Checkboxes */}
                <div className="flex justify-between items-center mb-6 text-sm text-gray-300">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
                    <input type="checkbox" className="accent-fuchsia-500 w-4 h-4" />
                    Lembre-se de mim
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
                    <input type="checkbox" required className="accent-cyan-500 w-4 h-4" />
                    Não sou um robô
                  </label>
                </div>

                {/* Botão de Submit Gradient */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-md bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.8)] hover:scale-[1.02] transition-all"
                >
                  Login
                </button>
              </motion.form>

            ) : (

              // === FORMULÁRIO DE CADASTRO ===
              <motion.form
                key="register"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col w-full"
                onSubmit={(e) => { e.preventDefault(); alert("Cadastro simulação!"); }}
              >
                <NeonInput label="Nickname" type="text" placeholder="Seu nome de jogador" required minLength={3} />
                
                <div className="flex gap-4">
                  <NeonInput label="Idade" type="number" placeholder="18" required />
                  <div className="w-full"></div> {/* Spacer para layout ficar interessante */}
                </div>

                <NeonInput label="Email" type="email" placeholder="player@email.com" required />
                <NeonInput label="Confirme seu Email" type="email" placeholder="player@email.com" required />
                <NeonInput label="Senha" type="password" placeholder="••••••••" required />

                <button
                  type="submit"
                  className="w-full py-3 mt-4 rounded-md bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] hover:scale-[1.02] transition-all"
                >
                  Cadastrar
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* 4. SEÇÃO DE REDES SOCIAIS E TOGGLE (Fica fixa embaixo independente do formulário) */}
        <div className="w-full flex flex-col items-center mt-6 border-t border-white/10 pt-6">
          <span className="text-gray-400 text-xs tracking-widest uppercase mb-4 relative bg-black/20 px-2 rounded backdrop-blur-sm">
            Ou {isLogin ? "Entre" : "Cadastre-se"} com
          </span>
          
          <div className="flex gap-4 mb-8">
            <button className="w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
              <GoogleIcon />
            </button>
            <button className="w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
              <FacebookIcon />
            </button>
          </div>

          {/* Botão de Toggle (Alternar entre Login e Registro) */}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="group flex items-center gap-3 bg-white/5 border border-white/20 px-6 py-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              {isLogin ? "Switch to Registration" : "Switch to Login"}
            </span>
            <div className={`w-8 h-4 rounded-full p-1 flex items-center transition-colors ${isLogin ? "bg-fuchsia-500/50 border border-fuchsia-500" : "bg-cyan-500/50 border border-cyan-500"}`}>
              <div className={`w-2 h-2 rounded-full bg-white shadow-md transform transition-transform ${isLogin ? "translate-x-0" : "translate-x-4"}`}></div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}