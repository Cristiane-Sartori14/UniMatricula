const db = require('./database');
const router = require('express').Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS disciplinas (
    id INTEGER PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE COLLATE NOCASE,
    nome TEXT NOT NULL,
    carga_horaria INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS professores (
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE
  );
`);

function falhar(status, mensagem) {
  const erro = new Error(mensagem);
  erro.status = status;
  throw erro;
}

function texto(valor, campo, minimo, maximo) {
  if (typeof valor !== 'string') falhar(400, `Informe o campo ${campo}.`);
  const resultado = valor.trim().replace(/\s+/g, ' ');
  if (resultado.length < minimo || resultado.length > maximo) {
    falhar(400, `${campo} deve ter entre ${minimo} e ${maximo} caracteres.`);
  }
  return resultado;
}

router.get('/disciplinas', (req, res) => {
  res.json(db.prepare('SELECT * FROM disciplinas ORDER BY nome COLLATE NOCASE').all());
});

router.post('/disciplinas', (req, res) => {
  const dados = req.body || {};
  const codigo = texto(dados.codigo, 'Código', 2, 20).toUpperCase();
  const nome = texto(dados.nome, 'Nome da disciplina', 3, 120);
  const cargaHoraria = Number(dados.carga_horaria);

  if (!/^[A-Z0-9][A-Z0-9._-]+$/.test(codigo)) {
    falhar(400, 'Use apenas letras, números, ponto, hífen ou sublinhado no código.');
  }
  if (!/^\d+$/.test(String(dados.carga_horaria)) || cargaHoraria < 1 || cargaHoraria > 1000) {
    falhar(400, 'A carga horária deve ser um número inteiro entre 1 e 1000 horas.');
  }
  if (db.prepare('SELECT id FROM disciplinas WHERE codigo = ?').get(codigo)) {
    falhar(409, 'Já existe uma disciplina com este código.');
  }

  const resultado = db.prepare('INSERT INTO disciplinas (codigo, nome, carga_horaria) VALUES (?, ?, ?)')
    .run(codigo, nome, cargaHoraria);
  res.status(201).json(db.prepare('SELECT * FROM disciplinas WHERE id = ?').get(resultado.lastInsertRowid));
});

router.get('/professores', (req, res) => {
  res.json(db.prepare('SELECT * FROM professores ORDER BY nome COLLATE NOCASE').all());
});

router.post('/professores', (req, res) => {
  const dados = req.body || {};
  const nome = texto(dados.nome, 'Nome do professor', 3, 120);
  const email = texto(dados.email, 'E-mail', 5, 160).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) falhar(400, 'Informe um e-mail válido.');
  if (db.prepare('SELECT id FROM professores WHERE email = ?').get(email)) {
    falhar(409, 'Já existe um professor com este e-mail.');
  }

  const resultado = db.prepare('INSERT INTO professores (nome, email) VALUES (?, ?)').run(nome, email);
  res.status(201).json(db.prepare('SELECT * FROM professores WHERE id = ?').get(resultado.lastInsertRowid));
});

module.exports = router;
