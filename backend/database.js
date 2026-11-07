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
    id INTEGER PRIMARY KEY,
    nome TEXT NOT NULL,
    registro TEXT NOT NULL UNIQUE
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
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'aluno'
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS cadastros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    nome TEXT NOT NULL
  );
`);

// ---------------------------------------------------------------
// SEEDS — alunos e usuários de demonstração
// ---------------------------------------------------------------

const alunosIniciais = [
  { id: 1, nome: 'Silvio Santos', registro: 'AL001' },
  { id: 2, nome: 'Ana Beatriz Souza', registro: 'AL002' },
  { id: 3, nome: 'Carlos Eduardo Lima', registro: 'AL003' },
  { id: 4, nome: 'Daniela Ferreira Rocha', registro: 'AL004' },
  { id: 5, nome: 'Eduardo Nunes Martins', registro: 'AL005' },
  { id: 6, nome: 'Fernanda Almeida Castro', registro: 'AL006' },
  { id: 7, nome: 'Gustavo Henrique Pires', registro: 'AL007' },
  { id: 8, nome: 'Helena Moreira Dias', registro: 'AL008' },
  { id: 9, nome: 'Igor Ramalho Barbosa', registro: 'AL009' },
  { id: 10, nome: 'Juliana Teixeira Campos', registro: 'AL010' },
];

const usuariosIniciais = [
  { id: 1, nome: 'Silvio Santos', email: 'silvio.santos@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 2, nome: 'Ana Beatriz Souza', email: 'ana.souza@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 3, nome: 'Carlos Eduardo Lima', email: 'carlos.lima@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 4, nome: 'Daniela Ferreira Rocha', email: 'daniela.rocha@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 5, nome: 'Eduardo Nunes Martins', email: 'eduardo.martins@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 6, nome: 'Fernanda Almeida Castro', email: 'fernanda.castro@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 7, nome: 'Gustavo Henrique Pires', email: 'gustavo.pires@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 8, nome: 'Helena Moreira Dias', email: 'helena.dias@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 9, nome: 'Igor Ramalho Barbosa', email: 'igor.barbosa@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 10, nome: 'Juliana Teixeira Campos', email: 'juliana.campos@unimatricula.edu.br', senha: '123456', perfil: 'aluno' },
  { id: 11, nome: 'Coordenação Acadêmica', email: 'coordenacao@unimatricula.edu.br', senha: '123456', perfil: 'admin' },
];

const cadastrosIniciais = [
  { tipo: 'professores', nome: 'Mariana Costa' },
  { tipo: 'professores', nome: 'Ricardo Mendes' },
  { tipo: 'professores', nome: 'Ana Ribeiro' },
  { tipo: 'professores', nome: 'Paulo Vasconcelos' },
  { tipo: 'professores', nome: 'Tatiane Borges' },
  { tipo: 'professores', nome: 'Leandro Mota' },
  { tipo: 'professores', nome: 'Simone Akiko Tanaka' },
  { tipo: 'professores', nome: 'Roberto Cordeiro' },
  { tipo: 'disciplinas', nome: 'Desenvolvimento Web' },
  { tipo: 'disciplinas', nome: 'Banco de Dados' },
  { tipo: 'disciplinas', nome: 'Engenharia de Software' },
  { tipo: 'disciplinas', nome: 'Algoritmos e Estruturas de Dados' },
  { tipo: 'disciplinas', nome: 'Programação Orientada a Objetos' },
  { tipo: 'disciplinas', nome: 'Arquitetura de Computadores' },
  { tipo: 'disciplinas', nome: 'Redes de Computadores' },
  { tipo: 'disciplinas', nome: 'Sistemas Operacionais' },
  { tipo: 'disciplinas', nome: 'Análise de Requisitos' },
  { tipo: 'disciplinas', nome: 'Gestão de Projetos de TI' },
  { tipo: 'disciplinas', nome: 'Segurança da Informação' },
  { tipo: 'disciplinas', nome: 'Interface Humano-Computador' },
];

const inserirAluno = db.prepare(
  'INSERT OR IGNORE INTO alunos (id, nome, registro) VALUES (@id, @nome, @registro)'
);

const inserirUsuario = db.prepare(`
  INSERT OR IGNORE INTO usuarios (id, nome, email, senha, perfil)
  VALUES (@id, @nome, @email, @senha, @perfil)
`);

const inserirCadastro = db.prepare(
  'INSERT OR IGNORE INTO cadastros (tipo, nome) VALUES (@tipo, @nome)'
);

// Atualiza o nome caso a linha já exista (resolve o caso "Aluno Exemplo")
const atualizarAluno = db.prepare('UPDATE alunos SET nome = ? WHERE id = ?');
const atualizarUsuario = db.prepare('UPDATE usuarios SET nome = ? WHERE id = ?');

const semear = db.transaction(() => {
  for (const aluno of alunosIniciais) {
    inserirAluno.run(aluno);
    atualizarAluno.run(aluno.nome, aluno.id);
  }
  for (const usuario of usuariosIniciais) {
    inserirUsuario.run(usuario);
    atualizarUsuario.run(usuario.nome, usuario.id);
  }
  for (const cadastro of cadastrosIniciais) {
    inserirCadastro.run(cadastro);
  }
});

semear();

module.exports = db;