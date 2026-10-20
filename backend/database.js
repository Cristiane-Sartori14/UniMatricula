
const Database = require('better-sqlite3');
const path = require('path');

const caminhoBanco = path.join(__dirname, 'unimatricula.db');

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

module.exports = db;
