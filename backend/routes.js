const db = require('./database');
const router = require('express').Router();
function fail(status, mensagem) { const e = new Error(mensagem); e.status = status; throw e; }
function id(value) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) fail(400, 'Identificador inválido.');
  return Number(value);
}
function aluno(value) {
  const key = id(value);
  if (!db.prepare('SELECT id FROM alunos WHERE id = ?').get(key)) fail(404, 'Aluno não encontrado.');
  return key;
}
router.get('/alunos', (req, res) => res.json(db.prepare('SELECT * FROM alunos ORDER BY nome').all()));
router.get('/turmas', (req, res) => {
  const key = req.query.aluno_id === undefined ? null : aluno(req.query.aluno_id);
  res.json(db.prepare(`SELECT t.*, EXISTS(SELECT 1 FROM matriculas m
    WHERE m.turma_id = t.id AND m.aluno_id = ? AND m.cancelada_em IS NULL) AS matriculado
    FROM turmas t ORDER BY t.id`).all(key).map(t => ({ ...t, matriculado: Boolean(t.matriculado) })));
});
router.get('/alunos/:id/matriculas', (req, res) => {
  res.json(db.prepare(`SELECT m.id AS matricula_id, m.criada_em, t.* FROM matriculas m
    JOIN turmas t ON t.id = m.turma_id WHERE m.aluno_id = ? AND m.cancelada_em IS NULL
    ORDER BY t.id`).all(aluno(req.params.id)));
});
const matricular = db.transaction((alunoId, turmaId) => {
  aluno(alunoId);
  const turma = db.prepare('SELECT * FROM turmas WHERE id = ?').get(turmaId);
  if (!turma) fail(404, 'Turma não encontrada.');
  if (db.prepare(`SELECT id FROM matriculas WHERE aluno_id = ? AND turma_id = ? AND cancelada_em IS NULL`).get(alunoId, turmaId)) fail(409, 'Matrícula já existente.');
  if (turma.vagas <= 0) fail(409, 'Não há vagas disponíveis.');
  // Regra atual do projeto: uma turma por dia e turno.
  if (db.prepare(`SELECT m.id FROM matriculas m JOIN turmas t ON t.id = m.turma_id
    WHERE m.aluno_id = ? AND m.cancelada_em IS NULL AND t.dia = ? AND t.turno = ?`)
    .get(alunoId, turma.dia, turma.turno)) fail(409, 'Existe conflito de horário.');
  db.prepare('UPDATE turmas SET vagas = vagas - 1 WHERE id = ? AND vagas > 0').run(turmaId);
  const result = db.prepare('INSERT INTO matriculas (aluno_id, turma_id) VALUES (?, ?)').run(alunoId, turmaId);
  return db.prepare('SELECT * FROM matriculas WHERE id = ?').get(result.lastInsertRowid);
});
router.post('/matriculas', (req, res) => res.status(201).json(matricular.immediate(id(req.body?.aluno_id), id(req.body?.turma_id))));
const cancelar = db.transaction((alunoId, turmaId) => {
  aluno(alunoId);
  const m = db.prepare(`SELECT id FROM matriculas WHERE aluno_id = ? AND turma_id = ? AND cancelada_em IS NULL`).get(alunoId, turmaId);
  if (!m) fail(404, 'Matrícula ativa não encontrada.');
  db.prepare('UPDATE matriculas SET cancelada_em = CURRENT_TIMESTAMP WHERE id = ?').run(m.id);
  db.prepare('UPDATE turmas SET vagas = vagas + 1 WHERE id = ?').run(turmaId);
  return { mensagem: 'Matrícula cancelada com sucesso.' };
});
router.post('/matriculas/cancelar', (req, res) => res.json(cancelar.immediate(id(req.body?.aluno_id), id(req.body?.turma_id))));
router.get('/institucional', (req, res) => {
  const turmas = db.prepare(`SELECT t.*, COUNT(m.id) AS matriculados, t.vagas + COUNT(m.id) AS capacidade
    FROM turmas t LEFT JOIN matriculas m ON m.turma_id = t.id AND m.cancelada_em IS NULL
    GROUP BY t.id ORDER BY t.id`).all();
  const matriculas = db.prepare(`SELECT m.*, a.nome AS aluno, a.registro, t.nome AS turma, t.codigo
    FROM matriculas m JOIN alunos a ON a.id = m.aluno_id JOIN turmas t ON t.id = m.turma_id ORDER BY m.id`).all();
  res.json({ resumo: {
    alunos: db.prepare('SELECT COUNT(*) AS total FROM alunos').get().total,
    turmas: turmas.length,
    matriculas_ativas: matriculas.filter(m => !m.cancelada_em).length,
    vagas_disponiveis: turmas.reduce((total, t) => total + t.vagas, 0),
  }, turmas, matriculas });
});
router.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);
  if (!erro.status) console.error(erro);
  res.status(erro.status || 500).json({ mensagem: erro.status ? erro.message : 'Erro interno.' });
});
module.exports = router;
