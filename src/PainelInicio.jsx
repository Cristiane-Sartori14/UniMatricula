import "./PainelInicio.css";

const DIAS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const DIAS_CURTOS = {
  "Segunda-feira": "SEG",
  "Terça-feira": "TER",
  "Quarta-feira": "QUA",
  "Quinta-feira": "QUI",
  "Sexta-feira": "SEX",
  "Sábado": "SÁB",
};

const TURNOS = ["Manhã", "Tarde", "Noite"];

function iniciais(nome) {
  return (nome || "")
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PainelInicio({ usuario, turmas, minhasTurmas, aoNavegar }) {
  const totalVagas = turmas.reduce((total, turma) => total + turma.vagas, 0);

  const temConflito = minhasTurmas.some((turma, indice, lista) =>
    lista.some(
      (outra, outroIndice) =>
        outroIndice > indice &&
        outra.dia === turma.dia &&
        outra.turno === turma.turno
    )
  );

  const turmasCriticas = [...turmas]
    .filter((turma) => turma.vagas <= 2)
    .sort((a, b) => a.vagas - b.vagas)
    .slice(0, 4);

  function definirProximoPasso() {
    if (minhasTurmas.length === 0) {
      return {
        etiqueta: "PRIMEIRO PASSO",
        titulo: "Monte sua grade",
        texto:
          "Você ainda não tem matrícula neste semestre. Escolha as disciplinas e organize sua semana.",
        botao: "Ver ofertas",
        destino: "Ofertas de turmas",
      };
    }
    if (temConflito) {
      return {
        etiqueta: "ATENÇÃO",
        titulo: "Existe um conflito na sua grade",
        texto:
          "Duas disciplinas estão no mesmo dia e turno. O sistema não permite manter as duas.",
        botao: "Revisar minha grade",
        destino: "Minha grade",
      };
    }
    if (minhasTurmas.length < 4) {
      return {
        etiqueta: "PODE MATRICULAR",
        titulo: "Sua grade ainda tem espaço",
        texto: `Você tem ${minhasTurmas.length} de 4 disciplinas. Confira as turmas com vagas disponíveis.`,
        botao: "Explorar ofertas",
        destino: "Ofertas de turmas",
      };
    }
    return {
      etiqueta: "TUDO CERTO",
      titulo: "Grade montada para o semestre",
      texto:
        "Você atingiu 4 disciplinas. Revise os horários antes do início das aulas.",
      botao: "Ver minha grade",
      destino: "Minha grade",
    };
  }

  const proximoPasso = definirProximoPasso();

  function turmaDoSlot(dia, turno) {
    return minhasTurmas.find(
      (turma) => turma.dia === dia && turma.turno === turno
    );
  }

  return (
    <div className="inicio">
      <section className={`inicio-hero ${temConflito ? "alerta" : ""}`}>
        <div className="inicio-hero-texto">
          <span className="inicio-eyebrow">
            SISTEMA DE MATRÍCULAS · 2026/2
          </span>
          <h2>Bom retorno, {usuario.nome.split(" ")[0]}.</h2>
          <p>Sua grade do semestre em um só lugar.</p>
        </div>
        <div className="inicio-avatar" aria-hidden="true">
          {iniciais(usuario.nome)}
        </div>
      </section>

      <section className="inicio-stats">
        <article className="inicio-stat">
          <strong>{turmas.length}</strong>
          <span>turmas ofertadas</span>
        </article>
        <article className="inicio-stat">
          <strong>{totalVagas}</strong>
          <span>vagas disponíveis</span>
        </article>
        <article className="inicio-stat">
          <strong>{minhasTurmas.length}</strong>
          <span>disciplinas na grade</span>
        </article>
        <article className={`inicio-stat ${temConflito ? "critico" : ""}`}>
          <strong>{temConflito ? "1" : "0"}</strong>
          <span>{temConflito ? "conflito" : "sem conflito"}</span>
        </article>
      </section>

      <div className="inicio-grade">
        <section className="inicio-painel inicio-proximo">
          <span className="inicio-etiqueta">{proximoPasso.etiqueta}</span>
          <h3>{proximoPasso.titulo}</h3>
          <p>{proximoPasso.texto}</p>
          <button
            className="inicio-botao"
            onClick={() => aoNavegar(proximoPasso.destino)}
          >
            {proximoPasso.botao} <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="inicio-painel inicio-agenda">
          <h3>Sua semana</h3>
          <p className="inicio-sub">
            {minhasTurmas.length === 0
              ? "Nenhuma disciplina na grade ainda."
              : `${minhasTurmas.length} de 4 disciplinas · 1 por dia e turno`}
          </p>

          <div className="agenda-grid">
            <div className="agenda-canto" />
            {TURNOS.map((turno) => (
              <div key={turno} className="agenda-turno">
                {turno.slice(0, 3)}
              </div>
            ))}

            {DIAS.map((dia) => (
              <div key={dia} className="agenda-linha">
                <div className="agenda-dia">{DIAS_CURTOS[dia]}</div>
                {TURNOS.map((turno) => {
                  const turma = turmaDoSlot(dia, turno);
                  return (
                    <div
                      key={turno}
                      className={turma ? "agenda-slot ocupado" : "agenda-slot"}
                      title={turma ? turma.nome : "Livre"}
                    >
                      {turma ? turma.codigo : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="inicio-painel inicio-criticas">
        <div className="inicio-criticas-topo">
          <div>
            <h3>Vagas críticas</h3>
            <p className="inicio-sub">
              Turmas com 2 vagas ou menos — prioridade de decisão.
            </p>
          </div>
          <button
            className="inicio-link"
            onClick={() => aoNavegar("Ofertas de turmas")}
          >
            Ver todas
          </button>
        </div>

        {turmasCriticas.length === 0 ? (
          <p className="inicio-vazio">
            Nenhuma turma com vagas críticas neste momento.
          </p>
        ) : (
          <ul className="criticas-lista">
            {turmasCriticas.map((turma) => {
              const total = turma.vagas + (turma.matriculado ? 1 : 0);
              const ocupacao =
                total > 0 ? Math.round(((total - turma.vagas) / total) * 100) : 0;
              return (
                <li key={turma.id} className="criticas-item">
                  <div className="criticas-info">
                    <strong>{turma.nome}</strong>
                    <span>
                      {turma.codigo} · {turma.dia} · {turma.horario}
                    </span>
                  </div>

                  <div className="criticas-barra">
                    <div className="criticas-trilha">
                      <div
                        className={`criticas-preenchida ${
                          turma.vagas === 0 ? "lotada" : ""
                        }`}
                        style={{ width: `${ocupacao}%` }}
                      />
                    </div>
                    <span className="criticas-vagas">
                      {turma.vagas === 0 ? "Esgotada" : `${turma.vagas} vaga${turma.vagas > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  <button
                    className="inicio-botao pequeno"
                    onClick={() => aoNavegar("Ofertas de turmas")}
                  >
                    Ver
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}