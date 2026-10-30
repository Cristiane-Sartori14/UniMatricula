import { useEffect, useState } from "react";
import "./Cadastros.css";

const DISCIPLINA_VAZIA = { codigo: "", nome: "", carga_horaria: "" };
const PROFESSOR_VAZIO = { nome: "", email: "" };

function Cadastros() {
  const [aba, setAba] = useState("Disciplinas");
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [disciplina, setDisciplina] = useState(DISCIPLINA_VAZIA);
  const [professor, setProfessor] = useState(PROFESSOR_VAZIO);
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroConsulta, setErroConsulta] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const disciplinasAbertas = aba === "Disciplinas";

  useEffect(() => {
    const controller = new AbortController();

    async function carregarCadastros() {
      try {
        const respostas = await Promise.all([
          fetch("http://localhost:3000/api/disciplinas", { signal: controller.signal }),
          fetch("http://localhost:3000/api/professores", { signal: controller.signal }),
        ]);
        if (respostas.some((resposta) => !resposta.ok)) {
          throw new Error("Não foi possível consultar os cadastros. Verifique se a API está funcionando.");
        }
        const [listaDisciplinas, listaProfessores] = await Promise.all(respostas.map((resposta) => resposta.json()));
        if (!controller.signal.aborted) {
          setDisciplinas(listaDisciplinas);
          setProfessores(listaProfessores);
        }
      } catch (erro) {
        if (!controller.signal.aborted) setErroConsulta(erro.message);
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }

    carregarCadastros();
    return () => controller.abort();
  }, [tentativa]);

  function trocarAba(destino) {
    setAba(destino);
    setBusca("");
    setMensagem("");
  }

  function alterarDisciplina(event) {
    const { name, value } = event.target;
    setDisciplina((atual) => ({ ...atual, [name]: value }));
    setMensagem("");
  }

  function alterarProfessor(event) {
    const { name, value } = event.target;
    setProfessor((atual) => ({ ...atual, [name]: value }));
    setMensagem("");
  }

  async function cadastrar(event) {
    event.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setMensagem("");
    setSucesso(false);

    try {
      const tipo = disciplinasAbertas ? "disciplinas" : "professores";
      const dados = disciplinasAbertas
        ? { ...disciplina, carga_horaria: Number(disciplina.carga_horaria) }
        : professor;
      const resposta = await fetch(`http://localhost:3000/api/${tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const cadastro = await resposta.json();
      if (!resposta.ok) throw new Error(cadastro.mensagem || "Não foi possível salvar o cadastro.");

      if (disciplinasAbertas) {
        setDisciplinas((atuais) => [...atuais, cadastro].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setDisciplina(DISCIPLINA_VAZIA);
      } else {
        setProfessores((atuais) => [...atuais, cadastro].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setProfessor(PROFESSOR_VAZIO);
      }
      setBusca("");
      setSucesso(true);
      setMensagem(disciplinasAbertas ? "Disciplina cadastrada com sucesso." : "Professor cadastrado com sucesso.");
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  const registros = disciplinasAbertas ? disciplinas : professores;
  const termo = busca.trim().toLowerCase();
  const filtrados = registros.filter((registro) =>
    registro.nome.toLowerCase().includes(termo) ||
    (disciplinasAbertas ? registro.codigo : registro.email).toLowerCase().includes(termo),
  );

  return (
    <div className="cadastros">
      <div className="admin-tabs" aria-label="Tipo de cadastro">
        {["Disciplinas", "Professores"].map((item) => (
          <button key={item} className={aba === item ? "admin-tab active" : "admin-tab"}
            aria-pressed={aba === item} disabled={salvando} onClick={() => trocarAba(item)}>
            {item}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{disciplinasAbertas ? "Cadastrar disciplina" : "Cadastrar professor"}</h2>
            <p>Os cadastros podem ser selecionados ao criar uma nova oferta.</p>
          </div>
        </div>

        {mensagem && <div className="cadastro-mensagem" role={sucesso ? "status" : "alert"}>{mensagem}</div>}
        <form className="offer-form" onSubmit={cadastrar}>
          {disciplinasAbertas ? (
            <>
              <label>
                Código da disciplina
                <input name="codigo" value={disciplina.codigo} onChange={alterarDisciplina}
                  placeholder="Ex.: ADS104" minLength={2} maxLength={20}
                  pattern="[A-Za-z0-9][A-Za-z0-9._\-]+" required disabled={salvando} />
              </label>
              <label>
                Nome da disciplina
                <input name="nome" value={disciplina.nome} onChange={alterarDisciplina}
                  placeholder="Ex.: Redes de Computadores" minLength={3} maxLength={120} required disabled={salvando} />
              </label>
              <label>
                Carga horária (horas)
                <input name="carga_horaria" type="number" value={disciplina.carga_horaria}
                  onChange={alterarDisciplina} min="1" max="1000" step="1" placeholder="Ex.: 60" required disabled={salvando} />
              </label>
            </>
          ) : (
            <>
              <label>
                Nome do professor
                <input name="nome" value={professor.nome} onChange={alterarProfessor}
                  placeholder="Ex.: Paula Lima" minLength={3} maxLength={120} required disabled={salvando} />
              </label>
              <label>
                E-mail
                <input name="email" type="email" value={professor.email} onChange={alterarProfessor}
                  placeholder="Ex.: paula@universidade.edu.br" maxLength={160} required disabled={salvando} />
              </label>
            </>
          )}
          <div className="form-actions cadastro-acoes">
            <button type="button" className="cancel-button" disabled={salvando} onClick={() => {
              if (disciplinasAbertas) setDisciplina(DISCIPLINA_VAZIA);
              else setProfessor(PROFESSOR_VAZIO);
              setMensagem("");
            }}>Limpar</button>
            <button type="submit" className="enroll-button" disabled={salvando || carregando || Boolean(erroConsulta)}>
              {salvando ? "Salvando..." : disciplinasAbertas ? "Cadastrar disciplina" : "Cadastrar professor"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel cadastro-consulta" aria-busy={carregando}>
        <div className="panel-heading">
          <div>
            <h2>{disciplinasAbertas ? "Disciplinas cadastradas" : "Professores cadastrados"}</h2>
            <p>Consulte os dados disponíveis para as ofertas.</p>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input type="search" aria-label="Buscar cadastro" placeholder={disciplinasAbertas ? "Buscar nome ou código..." : "Buscar nome ou e-mail..."}
              value={busca} onChange={(event) => setBusca(event.target.value)} />
          </label>
        </div>
        {carregando ? <p className="cadastro-aviso" role="status">Carregando cadastros...</p> : erroConsulta ? (
          <div className="cadastro-aviso" role="alert">
            <p>{erroConsulta}</p>
            <button className="enroll-button" onClick={() => {
              setErroConsulta(""); setCarregando(true); setTentativa((atual) => atual + 1);
            }}>Tentar novamente</button>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  {disciplinasAbertas && <th scope="col">CÓDIGO</th>}
                  <th scope="col">NOME</th>
                  <th scope="col">{disciplinasAbertas ? "CARGA HORÁRIA" : "E-MAIL"}</th>
                </tr></thead>
                <tbody>
                  {filtrados.map((registro) => (
                    <tr key={registro.id}>
                      {disciplinasAbertas && <td className="cadastro-codigo">{registro.codigo}</td>}
                      <td><strong>{registro.nome}</strong></td>
                      <td>{disciplinasAbertas ? `${registro.carga_horaria} h` : registro.email}</td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && <tr><td colSpan={disciplinasAbertas ? 3 : 2} className="no-results">
                    {registros.length === 0 ? "Nenhum cadastro realizado. Utilize o formulário acima." : "Nenhum cadastro encontrado."}
                  </td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer">Exibindo {filtrados.length} de {registros.length} cadastros</div>
          </>
        )}
      </section>
    </div>
  );
}

export default Cadastros;
