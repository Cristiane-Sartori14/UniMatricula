# API de matrículas

Na pasta backend: `npm.cmd install` e `npm.cmd run dev`.
Na raiz do projeto, em outro terminal: `npm.cmd run dev`.
Testes do backend: `npm.cmd test`, dentro de backend. Usam um banco temporário.

## Modelo

- turmas: ofertas existentes; vagas representa vagas restantes.
- alunos: identificação por nome e registro único.
- matriculas: relação aluno/turma com data de criação e cancelamento.
- Índice único impede duas matrículas ativas do mesmo aluno na mesma turma.
- Cancelar preserva o histórico e devolve uma vaga. É possível matricular novamente.
- As tabelas são criadas sem apagar as turmas existentes.

## Rotas

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | /api/alunos | Alunos cadastrados |
| GET | /api/turmas | Todas as ofertas |
| GET | /api/turmas?aluno_id=1 | Ofertas com indicador matriculado do aluno |
| GET | /api/alunos/1/matriculas | Turmas com matrícula ativa do aluno |
| POST | /api/matriculas | Cria matrícula e reduz uma vaga |
| POST | /api/matriculas/cancelar | Cancela matrícula e devolve uma vaga |
| GET | /api/institucional | Resumo, ocupação por turma, alunos por matrícula e histórico |

Os dois POST recebem JSON: `{ "aluno_id": 1, "turma_id": 1 }`.
Sucesso: 201 para criação, 200 para cancelamento e consultas.
Erros retornam `{ "mensagem": "..." }`: 400 para identificador inválido,
404 para registro inexistente, 409 para duplicidade, falta de vagas ou conflito.
As operações usam transações imediatas: matrícula e vagas mudam juntas.
Conflito segue a regra atual da interface: mesmo dia e turno.

A visão institucional recebe `resumo`, `turmas` e `matriculas`. A lista de matrículas
inclui canceladas; `cancelada_em` nulo significa ativa. Cada turma inclui
`matriculados`, `vagas` restantes e `capacidade` (soma dos dois).
Não há dados de ocupação anteriores aos registros deste projeto.

## Limites do protótipo

A interface usa o aluno de demonstração de id 1. Não há autenticação ou controle
de acesso; os identificadores enviados não comprovam identidade. A tela institucional
não foi criada: estas rotas fornecem os dados para sua implementação.
Não foram incluídos cadastro de cursos ou CRUD de turmas, pois não fazem parte
 destas operações. DATABASE_PATH permite escolher outro arquivo SQLite em testes.
