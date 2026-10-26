const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unimatricula-'));
process.env.DATABASE_PATH = path.join(dir, 'test.db');
const app = require('./server');
const db = require('./database');
test('criação de ofertas e visão institucional', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  const get = async url => (await fetch(base + url)).json();
  const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const oferta = { codigo: 'ads201', nome: 'Redes', professor: 'Paula Lima', dia: 'Quinta-feira', turno: 'Noite', horario: '19h30 - 21h10', vagas: 2 };
  try {
    assert.equal((await post('/turmas', {})).status, 400);
    assert.equal((await post('/turmas', { ...oferta, dia: 'Domingo' })).status, 400);
    assert.equal((await post('/turmas', { ...oferta, turno: 'Madrugada' })).status, 400);
    assert.equal((await post('/turmas', { ...oferta, vagas: -1 })).status, 400);
    assert.equal((await post('/turmas', { ...oferta, codigo: 'ADS101' })).status, 409);
    const criada = await post('/turmas', oferta);
    assert.equal(criada.status, 201);
    const turma = await criada.json();
    assert.equal(turma.codigo, 'ADS201');
    assert.equal((await post('/turmas', oferta)).status, 409);
    assert.equal((await get('/turmas')).length, 4);
    assert.equal((await post('/matriculas', { aluno_id: 1, turma_id: turma.id })).status, 201);
    const institucional = await get('/institucional');
    const ocupacao = institucional.turmas.find(t => t.id === turma.id);
    assert.deepEqual([ocupacao.matriculados, ocupacao.vagas, ocupacao.capacidade], [1, 1, 2]);
    assert.equal(institucional.resumo.turmas, 4);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    fs.rmSync(dir, { recursive: true });
  }
});
