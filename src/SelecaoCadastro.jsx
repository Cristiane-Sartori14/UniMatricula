import { useEffect, useState } from "react";

function SelecaoCadastro({ tipo, name, value, onChange, placeholder, required }) {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function carregarCadastros() {
      try {
        const resposta = await fetch(`http://localhost:3000/api/${tipo}`, {
          signal: controller.signal,
        });
        if (!resposta.ok) throw new Error("Não foi possível carregar os cadastros.");
        const dados = await resposta.json();
        if (!controller.signal.aborted) setRegistros(dados);
      } catch (erro) {
        if (!controller.signal.aborted) setErro(erro.message);
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }

    carregarCadastros();
    return () => controller.abort();
  }, [tipo, tentativa]);

  function tentarNovamente() {
    setErro("");
    setCarregando(true);
    setTentativa((atual) => atual + 1);
  }

  return (
    <>
      <select name={name} value={value} onChange={onChange} required={required}
        aria-label={tipo === "disciplinas" ? "Disciplina" : "Professor"}>
        <option value="" disabled>{carregando ? "Carregando..." : placeholder}</option>
        {registros.map((registro) => (
          <option key={registro.id} value={registro.nome}>
            {tipo === "disciplinas"
              ? `${registro.codigo} · ${registro.nome}`
              : `${registro.nome} · ${registro.email}`}
          </option>
        ))}
      </select>
      {erro ? (
        <small role="alert">
          {erro}{" "}
          <button type="button" className="cadastro-repetir" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </small>
      ) : !carregando && registros.length === 0 && (
        <small>Adicione o cadastro na aba Cadastros para selecionar aqui.</small>
      )}
    </>
  );
}

export default SelecaoCadastro;
