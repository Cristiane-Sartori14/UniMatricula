import { useState } from "react";
import "./Login.css";

export default function Login({ onEntrar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.mensagem || "Não foi possível entrar.");
      }

      onEntrar(dados.usuario);
    } catch (e) {
      setErro(e.message || "Falha de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-tela">
      <form className="login-cartao" onSubmit={handleSubmit}>
        <h1 className="login-titulo">UniMatrícula</h1>
        <p className="login-subtitulo">Acesse com seu e-mail institucional</p>

        {erro && <div className="login-erro">{erro}</div>}

        <div className="login-campo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="silvio.santos@unimatricula.edu.br"
            autoComplete="username"
            required
          />
        </div>

        <div className="login-campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="login-botao" type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <p className="login-dica">
          Protótipo acadêmico — use silvio.santos@unimatricula.edu.br / 123456
        </p>
      </form>
    </div>
  );
}