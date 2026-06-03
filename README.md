# Sistema de Cronograma Virtual Premium

Uma plataforma web moderna e responsiva para **Gestão de Alunos, Cursos e Cronogramas de Estudo**, projetada sob uma estética de alta fidelidade (*Dark Premium*). O ecossistema foi desenvolvido para atender escolas de música, tutores ou cursos livres, dividindo-se entre o **Painel do Professor (Administrativo)** e a **Área do Aluno (Visualização)** com integração em nuvem.

---

## Arquitetura e Fluxo de Dados

O projeto utiliza o **Firebase Realtime Database** como estrutura de persistência unificada (via protocolo REST) e adota um modelo híbrido de sincronização para mitigar conflitos de dados e otimizar a performance:

* **Persistência em Lote (Professor):** Todas as ações efetuadas no painel do professor modificam o estado da aplicação localmente em tempo real (manipulação do DOM e variáveis em memória). O envio e consolidação dos dados no banco de dados em nuvem ocorrem de forma controlada apenas ao clicar no botão **"Salvar Alterações na Nuvem"**. Isto garante estabilidade absoluta e previne travamentos durante a edição.
* **Sincronização Contínua (Aluno):** A interface do aluno consome os dados em modo de leitura através de um loop automático de consulta (`setInterval` a cada 3 segundos). Assim que o professor salva as atualizações, o aluno recebe o novo conteúdo de forma quase instantânea.

---

## Funcionalidades Principais

### 1. Painel do Professor (`professor.html`)
Organizado através de uma navegação dinâmica por abas que centraliza o controlo administrativo:

* **Aulas & Cronogramas:** Seleção de alunos para acompanhamento individual com cálculo automatizado de progresso (%). Permite o controlo de assiduidade/mensalidades (alternando entre *Aberto* e *Pago*) e o acompanhamento de tópicos através de caixas de seleção.
* **Gestão de Tarefas:** Módulo para atribuição de deveres de casa com descrição e prazos definidos. Inclui um painel de triagem para alterar o estado das entregas entre ` Analisando`, ` Concluído` ou ` Recusado`.
* **Estruturação Pedagógica (Cursos):**
    * Criação e remoção de disciplinas/instrumentos.
    * Criação de módulos (Fases) com suporte a reordenação fluida via *Drag-and-Drop* (Arrastar e Soltar).
    * Aninhamento estruturado de tópicos e exercícios para cada fase correspondente.
* **Matrículas & Acesso:** Registo de novos estudantes e geração algorítmica de um **Código de Acesso Único** (Ex: `M342`) para validação de segurança.
* **Zona de Limpeza:** Filtro seguro para exclusão em massa de registos obsoletos (cursos ou alunos).

### 2. Área do Aluno (`index.html`)
Um ambiente intuitivo e protegido contra modificações externas:

* **Autenticação Persistente:** Validação por código único com armazenamento local da sessão (`localStorage`). O aluno permanece ligado sem necessidade de reintroduzir o código a cada acesso.
* **Cronograma de Estudos:** Exibição do progresso geral da sua evolução, estado da mensalidade vigente e listagem cronológica das fases com marcação visual de itens concluídos.
* **Painel de Atividades:** Visualização clara das tarefas propostas pelo tutor, prazos limites e sinalização colorida do estado da avaliação.

---

## Tecnologias Utilizadas

* **Front-End:** HTML5 Estruturado, CSS3 Avançado (Variáveis Nativas, Flexbox, Grid Layout) e JavaScript Assíncrono (Vanilla JS).
* **Persistência de Dados:** Firebase Realtime Database (API REST através de pedidos `GET` e `PUT`).
* **Bibliotecas de Terceiros:**
    * [Sortable.js](https://github.com/SortableJS/Sortable) - Responsável pela reordenação por arrastamento dos elementos de interface.
    * [Google Material Symbols](https://fonts.google.com/icons) - Conjunto de ícones vetoriais em estilo arredondado.
* **UI/UX Design:** Interface construída com paleta de cores escura, acentuações em dourado (`#ffb100`), cantos suavizados (`border-radius: 16px`) e transições fluidas de estado (`transition: all 0.3s cubic-bezier`).

---

## Estrutura do Repositório

```bash
├── index.html       # Interface pública e autenticação do Aluno
├── professor.html   # Painel administrativo do Professor/Tutor
├── script.js        # Lógica de estados, persistência unificada e Firebase
└── style.css        # Arquitetura visual, variáveis CSS e design responsivo
