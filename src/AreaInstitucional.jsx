import { useEffect, useState } from "react";

const DIAS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const TURNOS = ["Manhã", "Tarde", "Noite"];

const OFERTA_VAZIA = {
  codigo: "",
  nome: "",
  professor: "",
  dia: "Segunda-feira",
  turno: "Noite",
  horario: "",
  vagas: "",
};

function formatarData(valor) {
  if (!valor) return "—";
  return new Date(valor.replace(" ", "T") + "Z").toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function AreaInstitucional({ setMensagem, aoCriarOferta }) {
  const [dados, setDados] = useState(null);
  const [versao, setVersao] = useState(0);
  const [aba, setAba] = useState("Ofertas e vagas");
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativas");
  const [novaOferta, setNovaOferta] = useState(OFERTA_VAZIA);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const resposta = await fetch("http://localhost:3000/api/institucional");

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os dados institucionais.");
        }

        setDados(await resposta.json());
      } catch (erro) {
        console.error("Erro ao carregar dados institucionais:", erro);
        setMensagem(
          "Não foi possível carregar os dados institucionais. Verifique se a API está funcionando.",
        );
      }
    }

    carregarDados();
  }, [versao, setMensagem]);

  const turmas = dados?.turmas ?? [];
  const matriculas = dados?.matriculas ?? [];
  const resumo = dados?.resumo ?? {
    alunos: 0,
    turmas: 0,
    matriculas_ativas: 0,
    vagas_disponiveis: 0,
  };

  const termo = busca.toLowerCase();

  const turmasFiltradas = turmas.filter(
    (turma) =>
      turma.nome.toLowerCase().includes(termo) ||
      turma.codigo.toLowerCase().includes(termo) ||
      turma.professor.toLowerCase().includes(termo),
  );

  const matriculasFiltradas = matriculas.filter((matricula) => {
    const correspondeBusca =
      matricula.aluno.toLowerCase().includes(termo) ||
      matricula.registro.toLowerCase().includes(termo) ||
      matricula.turma.toLowerCase().includes(termo);

    const correspondeTurma =
      filtroTurma === "" || String(matricula.turma_id) === filtroTurma;

    const correspondeStatus =
      filtroStatus === "todas" ||
      (filtroStatus === "ativas"
        ? !matricula.cancelada_em
        : Boolean(matricula.cancelada_em));

    return correspondeBusca && correspondeTurma && correspondeStatus;
  });

  function trocarAba(destino) {
    setAba(destino);
    setBusca("");
  }

  function verAlunos(turmaId) {
    setFiltroTurma(String(turmaId));
    setFiltroStatus("ativas");
    trocarAba("Alunos matriculados");
  }

  function alterarCampo(event) {
    const { name, value } = event.target;
    setNovaOferta((oferta) => ({ ...oferta, [name]: value }));
  }

  async function criarOferta(event) {
    event.preventDefault();
    setSalvando(true);

    try {
      const resposta = await fetch("http://localhost:3000/api/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...novaOferta, vagas: Number(novaOferta.vagas) }),
      });
      const dadosResposta = await resposta.json();
      if (!resposta.ok) throw new Error(dadosResposta.mensagem);

      setMensagem(`Oferta ${dadosResposta.codigo} criada com sucesso.`);
      setNovaOferta(OFERTA_VAZIA);
      setVersao((atual) => atual + 1);
      aoCriarOferta();
      trocarAba("Ofertas e vagas");
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <section className="stats admin-stats">
        <article className="stat-card">
          <div className="stat-icon blue">▤</div>
          <div>
            <span>Turmas ofertadas</span>
            <strong>{resumo.turmas}</strong>
            <small>Neste semestre</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon purple">◉</div>
          <div>
            <span>Alunos cadastrados</span>
            <strong>{resumo.alunos}</strong>
            <small>Na instituição</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon green">✓</div>
          <div>
            <span>Matrículas ativas</span>
            <strong>{resumo.matriculas_ativas}</strong>
            <small>Em todas as turmas</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon orange">▦</div>
          <div>
            <span>Vagas disponíveis</span>
            <strong>{resumo.vagas_disponiveis}</strong>
            <small>Nas turmas ofertadas</small>
          </div>
        </article>
      </section>

      <div className="admin-tabs" role="tablist">
        {["Ofertas e vagas", "Alunos matriculados", "Nova oferta"].map(
          (item) => (
            <button
              key={item}
              role="tab"
              aria-selected={aba === item}
              className={aba === item ? "admin-tab active" : "admin-tab"}
              onClick={() => trocarAba(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>

      {aba === "Ofertas e vagas" && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Ofertas e vagas</h2>
              <p>Acompanhe a ocupação de cada turma ofertada.</p>
            </div>

            <div className="panel-actions">
              <label className="search-box">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Buscar turma ou professor..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                />
              </label>
              <button
                className="enroll-button"
                onClick={() => trocarAba("Nova oferta")}
              >
                + Nova oferta
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>DISCIPLINA</th>
                  <th>PROFESSOR</th>
                  <th>HORÁRIO</th>
                  <th>OCUPAÇÃO</th>
                  <th>VAGAS</th>
                  <th>AÇÃO</th>
                </tr>
              </thead>

              <tbody>
                {turmasFiltradas.map((turma) => {
                  const ocupacao =
                    turma.capacidade > 0
                      ? Math.round(
                          (turma.matriculados / turma.capacidade) * 100,
                        )
                      : 0;

                  return (
                    <tr key={turma.id}>
                      <td>
                        <strong>{turma.nome}</strong>
                        <span className="course-code">{turma.codigo}</span>
                      </td>
                      <td>{turma.professor}</td>
                      <td>
                        <span>{turma.dia}</span>
                        <span className="course-code">
                          {turma.turno} · {turma.horario}
                        </span>
                      </td>
                      <td>
                        <div className="occupancy">
                          <div className="occupancy-bar">
                            <div
                              className={
                                ocupacao >= 100
                                  ? "occupancy-fill full"
                                  : "occupancy-fill"
                              }
                              style={{ width: `${ocupacao}%` }}
                            />
                          </div>
                          <span className="course-code">
                            {turma.matriculados}/{turma.capacidade} alunos ·{" "}
                            {ocupacao}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            turma.vagas > 0
                              ? "vacancy available"
                              : "vacancy unavailable"
                          }
                        >
                          {turma.vagas > 0 ? `${turma.vagas} vagas` : "Lotada"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="enrolled-button view-button"
                          onClick={() => verAlunos(turma.id)}
                        >
                          Ver alunos
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {turmasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-results">
                      Nenhuma turma encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            Exibindo {turmasFiltradas.length} de {turmas.length} turmas
          </div>
        </section>
      )}

      {aba === "Alunos matriculados" && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Alunos matriculados</h2>
              <p>Consulte as matrículas realizadas em cada turma.</p>
            </div>

            <label className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Buscar aluno ou registro..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </label>
          </div>

          <div className="filtros admin-filtros">
            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
            >
              <option value="">Todas as turmas</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={String(turma.id)}>
                  {turma.codigo} · {turma.nome}
                </option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="ativas">Matrículas ativas</option>
              <option value="canceladas">Matrículas canceladas</option>
              <option value="todas">Todas as matrículas</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ALUNO</th>
                  <th>TURMA</th>
                  <th>MATRÍCULA</th>
                  <th>CANCELAMENTO</th>
                  <th>SITUAÇÃO</th>
                </tr>
              </thead>

              <tbody>
                {matriculasFiltradas.map((matricula) => (
                  <tr key={matricula.id}>
                    <td>
                      <strong>{matricula.aluno}</strong>
                      <span className="course-code">{matricula.registro}</span>
                    </td>
                    <td>
                      <span>{matricula.turma}</span>
                      <span className="course-code">{matricula.codigo}</span>
                    </td>
                    <td>{formatarData(matricula.criada_em)}</td>
                    <td>{formatarData(matricula.cancelada_em)}</td>
                    <td>
                      <span
                        className={
                          matricula.cancelada_em
                            ? "vacancy unavailable"
                            : "vacancy available"
                        }
                      >
                        {matricula.cancelada_em ? "Cancelada" : "Ativa"}
                      </span>
                    </td>
                  </tr>
                ))}

                {matriculasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="5" className="no-results">
                      Nenhuma matrícula encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            Exibindo {matriculasFiltradas.length} de {matriculas.length}{" "}
            matrículas
          </div>
        </section>
      )}

      {aba === "Nova oferta" && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Nova oferta de turma</h2>
              <p>Cadastre uma nova turma para o semestre.</p>
            </div>
          </div>

          <form className="offer-form" onSubmit={criarOferta}>
            <label>
              Código
              <input
                name="codigo"
                placeholder="Ex.: ADS104"
                value={novaOferta.codigo}
                onChange={alterarCampo}
                required
              />
            </label>

            <label>
              Disciplina
              <input
                name="nome"
                placeholder="Ex.: Programação Orientada a Objetos"
                value={novaOferta.nome}
                onChange={alterarCampo}
                required
              />
            </label>

            <label>
              Professor
              <input
                name="professor"
                placeholder="Nome do professor"
                value={novaOferta.professor}
                onChange={alterarCampo}
                required
              />
            </label>

            <label>
              Dia
              <select name="dia" value={novaOferta.dia} onChange={alterarCampo}>
                {DIAS.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Turno
              <select
                name="turno"
                value={novaOferta.turno}
                onChange={alterarCampo}
              >
                {TURNOS.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Horário
              <input
                name="horario"
                placeholder="Ex.: 19h30 - 21h10"
                value={novaOferta.horario}
                onChange={alterarCampo}
                required
              />
            </label>

            <label>
              Vagas
              <input
                name="vagas"
                type="number"
                min="0"
                max="500"
                step="1"
                placeholder="Ex.: 40"
                value={novaOferta.vagas}
                onChange={alterarCampo}
                required
              />
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setNovaOferta(OFERTA_VAZIA)}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="enroll-button"
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Criar oferta"}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

export default AreaInstitucional;
