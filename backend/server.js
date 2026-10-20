
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Insere as turmas iniciais apenas se ainda não existirem.
const inserirTurma = db.prepare(`
  INSERT OR IGNORE INTO turmas
    (id, codigo, nome, professor, dia, turno, horario, vagas)
  VALUES
    (@id, @codigo, @nome, @professor, @dia, @turno, @horario, @vagas)
`);

const turmasIniciais = [
  {
    id: 1,
    codigo: 'ADS101',
    nome: 'Desenvolvimento Web',
    professor: 'Mariana Costa',
    dia: 'Segunda-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 5,
  },
  {
    id: 2,
    codigo: 'ADS102',
    nome: 'Banco de Dados',
    professor: 'Ricardo Mendes',
    dia: 'Terça-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 3,
  },
  {
    id: 3,
    codigo: 'ADS103',
    nome: 'Engenharia de Software',
    professor: 'Ana Ribeiro',
    dia: 'Quarta-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 0,
  },
];

const inserirTurmasIniciais = db.transaction(() => {
  for (const turma of turmasIniciais) {
    inserirTurma.run(turma);
  }
});

inserirTurmasIniciais();

app.get('/', (req, res) => {
  res.json({ mensagem: 'API UniMatrícula funcionando!' });
});

// Agora os dados vêm do SQLite.
app.get('/api/turmas', (req, res) => {
  const turmas = db.prepare('SELECT * FROM turmas ORDER BY id').all();
  res.json(turmas);
});

app.listen(PORT, () => {
  console.log(`API UniMatrícula rodando em http://localhost:${PORT}`);
});
