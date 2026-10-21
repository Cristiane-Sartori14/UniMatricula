import { useEffect, useState } from 'react';
import './App.css';


function App() {
const [turmas, setTurmas] = useState([]);
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [pagina, setPagina] = useState('Início');

   useEffect(() => {
    async function carregarTurmas() {
      try {
        const resposta = await fetch(
          'http://localhost:3000/api/turmas?aluno_id=1'
        );

        if (!resposta.ok) {
          throw new Error('Não foi possível carregar as turmas.');
        }

        const dados = await resposta.json();

        const turmasFormatadas = dados.map((turma) => ({
          ...turma,
          disciplina: turma.nome,
          matriculado: Boolean(turma.matriculado),
        }));

        setTurmas(turmasFormatadas);
      } catch (erro) {
        console.error('Erro ao carregar turmas:', erro);
        setMensagem(
          'Não foi possível carregar as turmas. Verifique se a API está funcionando.'
        );
      }
    }

    carregarTurmas();
  }, []);
  
  const minhasTurmas = turmas.filter(
    (turma) => turma.matriculado
  );

  const turmasFiltradas = turmas.filter((turma) => {
    const termo = busca.toLowerCase();

    return (
      turma.disciplina.toLowerCase().includes(termo) ||
      turma.codigo.toLowerCase().includes(termo) ||
      turma.professor.toLowerCase().includes(termo)
    );
  });

  async function atualizarMatricula(id, cancelar = false) {
    try {
      const resposta = await fetch('http://localhost:3000/api/matriculas' + (cancelar ? '/cancelar' : ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id: 1, turma_id: id }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem);
      setMensagem(cancelar ? 'Matr?cula cancelada com sucesso.' : 'Matr?cula realizada com sucesso.');
      const consulta = await fetch('http://localhost:3000/api/turmas?aluno_id=1');
      if (!consulta.ok) throw new Error('Opera??o salva. Recarregue a p?gina para atualizar a lista.');
      const lista = await consulta.json();
      setTurmas(lista.map(turma => ({ ...turma, disciplina: turma.nome })));
    } catch (erro) {
      setMensagem(erro.message);
    }
  }

  function matricular(id) { return atualizarMatricula(id); }
  function cancelarMatricula(id) { return atualizarMatricula(id, true); }

  function navegar(destino) {
    setPagina(destino);
    setMensagem('');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">U</div>
          <div>
            <h2>UniMatrícula</h2>
            <span>Portal acadêmico</span>
          </div>
        </div>

        <p className="menu-label">MENU PRINCIPAL</p>

        <nav className="navigation">
          {[
            { nome: 'Início', icone: '⌂' },
            { nome: 'Ofertas de turmas', icone: '▤' },
            { nome: 'Minha grade', icone: '▦' },
          ].map((item) => (
            <button
              key={item.nome}
              className={
                pagina === item.nome
                  ? 'nav-item active'
                  : 'nav-item'
              }
              onClick={() => navegar(item.nome)}
            >
              <span>{item.icone}</span>
              {item.nome}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">AL</div>
          <div>
            <strong>Aluno Exemplo</strong>
            <span>Curso de ADS</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              Portal acadêmico / {pagina}
            </span>
            <h1>
              {pagina === 'Início'
                ? 'Visão geral'
                : pagina}
            </h1>
          </div>

          <div className="semester">
            <span className="status-dot" />
            Semestre 2026/2
          </div>
        </header>

        {mensagem && (
          <div className="feedback" role="status">
            {mensagem}
            <button
              className="close-feedback"
              onClick={() => setMensagem('')}
              aria-label="Fechar mensagem"
            >
              ×
            </button>
          </div>
        )}

        {pagina !== 'Minha grade' && (
          <section className="welcome">
            <div>
              <span className="eyebrow">
                SISTEMA DE MATRÍCULAS
              </span>
              <h2>
                Olá, estudante! 👋
              </h2>
              <p>
                Consulte as ofertas e organize sua grade
                acadêmica para este semestre.
              </p>
              <button
                className="primary-button"
                onClick={() => navegar('Ofertas de turmas')}
              >
                Consultar ofertas <span>→</span>
              </button>
            </div>

            <div className="welcome-decoration" aria-hidden="true">
              <div className="decoration-circle">U</div>
            </div>
          </section>
        )}

        <section className="stats">
          <article className="stat-card">
            <div className="stat-icon blue">▤</div>
            <div>
              <span>Turmas ofertadas</span>
              <strong>{turmas.length}</strong>
              <small>Neste semestre</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <span>Minhas matrículas</span>
              <strong>{minhasTurmas.length}</strong>
              <small>Turmas selecionadas</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange">▦</div>
            <div>
              <span>Vagas disponíveis</span>
              <strong>
                {turmas.reduce(
                  (total, turma) => total + turma.vagas,
                  0
                )}
              </strong>
              <small>Nas turmas ofertadas</small>
            </div>
          </article>
        </section>

        {pagina === 'Minha grade' ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Minha grade acadêmica</h2>
                <p>Turmas em que você está matriculado.</p>
              </div>
            </div>

            {minhasTurmas.length === 0 ? (
              <div className="empty-state">
                <span>▦</span>
                <h3>Nenhuma matrícula realizada</h3>
                <p>
                  Consulte as ofertas para selecionar suas
                  primeiras disciplinas.
                </p>
                <button
                  className="primary-button"
                  onClick={() => navegar('Ofertas de turmas')}
                >
                  Ver ofertas
                </button>
              </div>
            ) : (
              <div className="course-list">
                {minhasTurmas.map((turma) => (
                  <article className="course-card" key={turma.id}>
                    <div>
                      <strong>{turma.disciplina}</strong>
                      <p>
                        {turma.dia} · {turma.turno} ·{' '}
                        {turma.horario}
                      </p>
                      <small>Professor: {turma.professor}</small>
                    </div>
                    <button
                      className="cancel-button"
                      onClick={() => cancelarMatricula(turma.id)}
                    >
                      Cancelar
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  {pagina === 'Início'
                    ? 'Ofertas em destaque'
                    : 'Ofertas de turmas'}
                </h2>
                <p>
                  Consulte horários, professores e vagas.
                </p>
              </div>

              <label className="search-box">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Buscar disciplina..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                />
              </label>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>DISCIPLINA</th>
                    <th>PROFESSOR</th>
                    <th>HORÁRIO</th>
                    <th>VAGAS</th>
                    <th>AÇÃO</th>
                  </tr>
                </thead>

                <tbody>
                  {turmasFiltradas.map((turma) => (
                    <tr key={turma.id}>
                      <td>
                        <strong>{turma.disciplina}</strong>
                        <span className="course-code">
                          {turma.codigo}
                        </span>
                      </td>
                      <td>{turma.professor}</td>
                      <td>
                        <span>{turma.dia}</span>
                        <span className="course-code">
                          {turma.turno} · {turma.horario}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            turma.vagas > 0
                              ? 'vacancy available'
                              : 'vacancy unavailable'
                          }
                        >
                          {turma.vagas > 0
                            ? `${turma.vagas} vagas`
                            : 'Lotada'}
                        </span>
                      </td>
                      <td>
                        {turma.matriculado ? (
                          <button
                            className="enrolled-button"
                            disabled
                          >
                            Matriculado ✓
                          </button>
                        ) : (
                          <button
                            className="enroll-button"
                            disabled={turma.vagas === 0}
                            onClick={() => matricular(turma.id)}
                          >
                            {turma.vagas === 0
                              ? 'Sem vagas'
                              : 'Matricular'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {turmasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="5" className="no-results">
                        Nenhuma turma encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              Exibindo {turmasFiltradas.length} de {turmas.length}{' '}
              turmas
            </div>
          </section>
        )}

        <footer className="footer">
          UniMatrícula · Projeto acadêmico de Front-End
        </footer>
      </main>
    </div>
  );
}

export default App;