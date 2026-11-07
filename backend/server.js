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
  // ---------------- Bloco original ----------------
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

  // ---------------- Bloco anterior (4 a 12) ----------------
  {
    id: 4,
    codigo: 'ADS104',
    nome: 'Algoritmos e Estruturas de Dados',
    professor: 'Paulo Vasconcelos',
    dia: 'Quinta-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 4,
  },
  {
    id: 5,
    codigo: 'ADS105',
    nome: 'Programação Orientada a Objetos',
    professor: 'Tatiane Borges',
    dia: 'Sexta-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 6,
  },
  {
    id: 6,
    codigo: 'ADS106',
    nome: 'Arquitetura de Computadores',
    professor: 'Leandro Mota',
    dia: 'Segunda-feira',
    turno: 'Manhã',
    horario: '08h00 - 09h40',
    vagas: 8,
  },
  {
    id: 7,
    codigo: 'ADS107',
    nome: 'Redes de Computadores',
    professor: 'Simone Akiko Tanaka',
    dia: 'Terça-feira',
    turno: 'Manhã',
    horario: '08h00 - 09h40',
    vagas: 10,
  },
  {
    id: 8,
    codigo: 'ADS108',
    nome: 'Sistemas Operacionais',
    professor: 'Roberto Cordeiro',
    dia: 'Quarta-feira',
    turno: 'Tarde',
    horario: '14h00 - 15h40',
    vagas: 7,
  },
  {
    id: 9,
    codigo: 'ADS109',
    nome: 'Análise de Requisitos',
    professor: 'Mariana Costa',
    dia: 'Quinta-feira',
    turno: 'Tarde',
    horario: '14h00 - 15h40',
    vagas: 2,
  },
  {
    id: 10,
    codigo: 'ADS110',
    nome: 'Gestão de Projetos de TI',
    professor: 'Ricardo Mendes',
    dia: 'Sexta-feira',
    turno: 'Tarde',
    horario: '14h00 - 15h40',
    vagas: 12,
  },
  {
    id: 11,
    codigo: 'ADS111',
    nome: 'Segurança da Informação',
    professor: 'Paulo Vasconcelos',
    dia: 'Sábado',
    turno: 'Manhã',
    horario: '08h00 - 11h30',
    vagas: 15,
  },
  {
    id: 12,
    codigo: 'ADS112',
    nome: 'Interface Humano-Computador',
    professor: 'Tatiane Borges',
    dia: 'Sábado',
    turno: 'Tarde',
    horario: '13h30 - 17h00',
    vagas: 1,
  },

  // ---------------- NOVAS: 10 disciplinas ----------------
  // Conflitos propositais com ADS101 (Segunda, Noite 19h30)
  {
    id: 13,
    codigo: 'ADS201',
    nome: 'Programação para Dispositivos Móveis',
    professor: 'Simone Akiko Tanaka',
    dia: 'Segunda-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 9,
  },
  {
    id: 14,
    codigo: 'ADS202',
    nome: 'Computação em Nuvem',
    professor: 'Roberto Cordeiro',
    dia: 'Segunda-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 2,
  },
  // Conflito com ADS102 (Terça, Noite)
  {
    id: 15,
    codigo: 'ADS203',
    nome: 'Inteligência Artificial',
    professor: 'Leandro Mota',
    dia: 'Terça-feira',
    turno: 'Noite',
    horario: '19h30 - 21h10',
    vagas: 6,
  },
  // Conflito com ADS106 (Segunda, Manhã)
  {
    id: 16,
    codigo: 'ADS204',
    nome: 'Matemática Discreta',
    professor: 'Ana Ribeiro',
    dia: 'Segunda-feira',
    turno: 'Manhã',
    horario: '08h00 - 09h40',
    vagas: 11,
  },
  // Conflito com ADS107 (Terça, Manhã)
  {
    id: 17,
    codigo: 'ADS205',
    nome: 'Estatística Aplicada',
    professor: 'Mariana Costa',
    dia: 'Terça-feira',
    turno: 'Manhã',
    horario: '08h00 - 09h40',
    vagas: 3,
  },
  // Conflito com ADS108 (Quarta, Tarde)
  {
    id: 18,
    codigo: 'ADS206',
    nome: 'Qualidade de Software',
    professor: 'Tatiane Borges',
    dia: 'Quarta-feira',
    turno: 'Tarde',
    horario: '14h00 - 15h40',
    vagas: 1,
  },
  // Conflito com ADS109 (Quinta, Tarde)
  {
    id: 19,
    codigo: 'ADS207',
    nome: 'Governança de TI',
    professor: 'Paulo Vasconcelos',
    dia: 'Quinta-feira',
    turno: 'Tarde',
    horario: '14h00 - 15h40',
    vagas: 0,
  },
  // Conflito com ADS111 (Sábado, Manhã)
  {
    id: 20,
    codigo: 'ADS208',
    nome: 'Empreendedorismo e Inovação',
    professor: 'Ricardo Mendes',
    dia: 'Sábado',
    turno: 'Manhã',
    horario: '08h00 - 11h30',
    vagas: 14,
  },
  // Turno novo: Quarta de manhã (sem conflito)
  {
    id: 21,
    codigo: 'ADS209',
    nome: 'Banco de Dados Avançado',
    professor: 'Ricardo Mendes',
    dia: 'Quarta-feira',
    turno: 'Manhã',
    horario: '08h00 - 09h40',
    vagas: 5,
  },
  // Turno novo: Sexta de manhã (sem conflito)
  {
    id: 22,
    codigo: 'ADS210',
    nome: 'Tópicos Especiais em Sistemas',
    professor: 'Ana Ribeiro',
    dia: 'Sexta-feira',
    turno: 'Manhã',
    horario: '08h00 - 09h40',
    vagas: 2,
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

app.use('/api', require('./routes'));

if (require.main === module) {
  app.listen(PORT, () =>
    console.log('API UniMatrícula rodando em http://localhost:' + PORT)
  );
}

module.exports = app;