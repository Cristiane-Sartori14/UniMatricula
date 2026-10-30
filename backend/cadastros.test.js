const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unimatricula-cadastros-'));
process.env.DATABASE_PATH = path.join(dir, 'test.db');
const app = require('./server');
const db = require('./database');

test('cadastros de disciplinas e professores', async (t) => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  const get = async rota => {
    const resposta = await fetch(base + rota);
    assert.equal(resposta.status, 200);
    return resposta.json();
  };
  const post = (rota, body) => fetch(base + rota, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  let disciplina;
  let professor;

  try {
    await t.test('adiciona os cadastros sem alterar as ofertas existentes', async () => {
      assert.deepEqual(await get('/disciplinas'), []);
      assert.deepEqual(await get('/professores'), []);
      assert.equal((await get('/turmas')).length, 3);
      assert.equal(db.prepare('PRAGMA table_info(turmas)').all().length, 8);
    });

    await t.test('valida os dados da disciplina e impede código repetido', async () => {
      const dados = { codigo: ' ads401 ', nome: '  Redes   de Computadores ', carga_horaria: 60 };
      const resposta = await post('/disciplinas', dados);
      assert.equal(resposta.status, 201);
      disciplina = await resposta.json();
      assert.equal(disciplina.codigo, 'ADS401');
      assert.equal(disciplina.nome, 'Redes de Computadores');
      assert.equal(disciplina.carga_horaria, 60);
      assert.equal((await post('/disciplinas', { ...dados, codigo: 'ads401' })).status, 409);
      for (const alteracao of [
        { codigo: '' }, { codigo: 'X' }, { codigo: 'A B' }, { codigo: 'X'.repeat(21) },
        { nome: '   ' }, { nome: 'AB' }, { nome: 'X'.repeat(121) },
        { carga_horaria: 0 }, { carga_horaria: -1 }, { carga_horaria: 1.5 },
        { carga_horaria: 1001 }, { carga_horaria: null }, { carga_horaria: true },
      ]) {
        const invalida = await post('/disciplinas', { ...dados, codigo: 'NOVO', ...alteracao });
        assert.equal(invalida.status, 400, JSON.stringify(alteracao));
        assert.equal(typeof (await invalida.json()).mensagem, 'string');
      }
      assert.equal((await post('/disciplinas', {})).status, 400);
      assert.equal((await get('/disciplinas')).length, 1);
    });

    await t.test('valida os dados do professor e impede e-mail repetido', async () => {
      const dados = { nome: '  Paula   Lima ', email: ' PAULA@exemplo.edu.br ' };
      const resposta = await post('/professores', dados);
      assert.equal(resposta.status, 201);
      professor = await resposta.json();
      assert.equal(professor.nome, 'Paula Lima');
      assert.equal(professor.email, 'paula@exemplo.edu.br');
      assert.equal((await post('/professores', { ...dados, email: 'paula@exemplo.edu.br' })).status, 409);
      for (const alteracao of [
        { nome: '   ' }, { nome: 'AB' }, { nome: 'X'.repeat(121) },
        { email: '' }, { email: 'invalido' }, { email: 'a@b' }, { email: 'a b@exemplo.com' },
        { email: 'a'.repeat(161) + '@exemplo.com' },
      ]) {
        assert.equal((await post('/professores', { ...dados, email: 'outro@exemplo.com', ...alteracao })).status, 400);
      }
      assert.equal((await post('/professores', {})).status, 400);
      assert.equal((await get('/professores')).length, 1);
    });

    await t.test('persiste os cadastros no SQLite', () => {
      const Database = require('better-sqlite3');
      const reaberto = new Database(process.env.DATABASE_PATH, { readonly: true });
      try {
        assert.equal(reaberto.prepare('SELECT nome FROM disciplinas WHERE id = ?').get(disciplina.id).nome, disciplina.nome);
        assert.equal(reaberto.prepare('SELECT email FROM professores WHERE id = ?').get(professor.id).email, professor.email);
      } finally {
        reaberto.close();
      }
    });

    await t.test('usa os cadastros no contrato original de ofertas e matrículas', async () => {
      const resposta = await post('/turmas', {
        codigo: 'ADS401-A', nome: disciplina.nome, professor: professor.nome,
        dia: 'Quinta-feira', turno: 'Noite', horario: '19h30 - 21h10', vagas: 2,
      });
      assert.equal(resposta.status, 201);
      const turma = await resposta.json();
      assert.equal(turma.nome, disciplina.nome);
      assert.equal(turma.professor, professor.nome);
      const matricula = { aluno_id: 1, turma_id: turma.id };
      assert.equal((await post('/matriculas', matricula)).status, 201);
      assert.equal((await post('/matriculas', matricula)).status, 409);
      const institucional = await get('/institucional');
      assert.equal(institucional.turmas.find(turmaAtual => turmaAtual.id === turma.id).matriculados, 1);
      assert.equal((await post('/matriculas/cancelar', matricula)).status, 200);
      assert.equal((await get('/turmas')).find(turmaAtual => turmaAtual.id === turma.id).vagas, 2);
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
    fs.rmSync(dir, { recursive: true });
  }
});
