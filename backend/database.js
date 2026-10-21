
const Database = require('better-sqlite3');
const path = require('path');

const caminhoBanco = process.env.DATABASE_PATH || path.join(__dirname, 'unimatricula.db');

const db = new Database(caminhoBanco);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS turmas (
    id INTEGER PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    professor TEXT NOT NULL,
    dia TEXT NOT NULL,
    turno TEXT NOT NULL,
    horario TEXT NOT NULL,
    vagas INTEGER NOT NULL DEFAULT 0
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY, nome TEXT NOT NULL, registro TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS matriculas (
    id INTEGER PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id),
    turma_id INTEGER NOT NULL REFERENCES turmas(id),
    criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelada_em TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS matricula_ativa_unica
    ON matriculas(aluno_id, turma_id) WHERE cancelada_em IS NULL;
  CREATE INDEX IF NOT EXISTS matriculas_por_turma ON matriculas(turma_id);
  INSERT OR IGNORE INTO alunos (id, nome, registro) VALUES (1, 'Aluno Exemplo', 'AL001');
`);

module.exports = db;
