const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unimatricula-'));
process.env.DATABASE_PATH = path.join(dir, 'test.db');
const app = require('./server');
const db = require('./database');
test('matrículas, validações, cancelamento e persistência', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  const get = async url => (await fetch(base + url)).json();
  const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const body = { aluno_id: 1, turma_id: 1 };
  try {
    assert.equal((await post('/matriculas', {})).status, 400);
    assert.equal((await post('/matriculas', { aluno_id: 99, turma_id: 1 })).status, 404);
    assert.equal((await post('/matriculas', { aluno_id: 1, turma_id: 99 })).status, 404);
    assert.equal((await post('/matriculas', { aluno_id: 1, turma_id: 3 })).status, 409);
    const attempts = await Promise.all([post('/matriculas', body), post('/matriculas', body)]);
    assert.deepEqual(attempts.map(r => r.status).sort(), [201, 409]);
    assert.equal((await get('/turmas?aluno_id=1'))[0].vagas, 4);
    assert.equal((await get('/alunos/1/matriculas')).length, 1);
    const Database = require('better-sqlite3');
    const reopened = new Database(process.env.DATABASE_PATH);
    assert.equal(reopened.prepare('SELECT COUNT(*) AS n FROM matriculas WHERE cancelada_em IS NULL').get().n, 1);
    reopened.close();
    db.prepare(`INSERT INTO turmas VALUES (99, 'TEST', 'Teste', 'Professor', 'Segunda-feira', 'Noite', '19h30 - 21h10', 1)`).run();
    assert.equal((await post('/matriculas', { aluno_id: 1, turma_id: 99 })).status, 409);
    assert.equal((await get('/institucional')).resumo.matriculas_ativas, 1);
    assert.equal((await post('/matriculas/cancelar', body)).status, 200);
    assert.equal((await post('/matriculas/cancelar', body)).status, 404);
    assert.equal((await get('/turmas?aluno_id=1'))[0].vagas, 5);
    assert.equal((await get('/alunos/1/matriculas')).length, 0);
    assert.equal((await post('/matriculas', body)).status, 201);
    assert.equal((await get('/institucional')).matriculas.length, 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    fs.rmSync(dir, { recursive: true });
  }
});
