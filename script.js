// --- CONFIGURAÇÃO DO BANCO DE DADOS EM NUVEM (FIREBASE INTEGRADO) ---
const DB_URL = "https://meu-cronograma-virtual-default-rtdb.firebaseio.com/escola";

const seletorAluno = document.getElementById('seletor-aluno');
const seletorAlunoTarefa = document.getElementById('seletor-aluno-tarefa');
const areaCronograma = document.getElementById('area-cronograma');
const tituloCronograma = document.getElementById('nome-aluno-titulo');
const fasesCronogramaContainer = document.getElementById('fases-cronograma-container');
const progressoBarra = document.getElementById('progresso-barra-preenchimento');
const progressoTexto = document.getElementById('progresso-porcentagem');

const labelMesAtual = document.getElementById('label-mes-atual');
const btnAlternarPagamento = document.getElementById('btn-alternar-pagamento');
const tagMensalidadeAluno = document.getElementById('tag-mensalidade-aluno');

const inputNovoInstrumento = document.getElementById('novo-instrumento-nome');
const btnAddInstrumento = document.getElementById('btn-add-instrumento');
const seletorInstrumentoFase = document.getElementById('seletor-instrumento-fase');
const inputNovaFase = document.getElementById('nova-fase-nome');
const btnAddFase = document.getElementById('btn-add-fase');
const listaFasesAtual = document.getElementById('lista-fases-atual');
const seletorInstrumentoConfig = document.getElementById('seletor-instrumento-config');
const seletorFaseTopico = document.getElementById('seletor-fase-topico');
const inputNovoTopico = document.getElementById('novo-topico-nome');
const btnAddTopico = document.getElementById('btn-add-topico');
const listaTopicosAtual = document.getElementById('lista-topicos-atual'); 
const inputNovoAlunoNome = document.getElementById('novo-aluno-nome');
const seletorInstrumentoAluno = document.getElementById('seletor-instrumento-aluno');
const btnAdicionarAluno = document.getElementById('btn-adicionar-aluno');
const listaInstrumentosExclusao = document.getElementById('lista-instrumentos-exclusao');
const btnRemoverInstrumentosMassa = document.getElementById('btn-remover-instrumentos-massa');
const listaAlunosExclusao = document.getElementById('lista-alunos-exclusao');
const btnRemoverAlunosMassa = document.getElementById('btn-remover-alunos-massa');
const tabelaCodigosAlunos = document.getElementById('tabela-codigos-alunos');

const txtNovaTarefa = document.getElementById('nova-tarefa-texto');
const dateNovaTarefa = document.getElementById('nova-tarefa-data');
const btnAddTarefa = document.getElementById('btn-adicionar-tarefa');
const listaTarefasAdminContainer = document.getElementById('lista-tarefas-admin-container');
const listaTarefasAlunoContainer = document.getElementById('lista-tarefas-aluno-container');

const inputCodigoAluno = document.getElementById('codigo-aluno-input');
const btnEntrarAluno = document.getElementById('btn-entrar-aluno');
const blocoLoginAluno = document.getElementById('bloco-login-aluno');
const conteudoAlunoAutenticado = document.getElementById('conteúdo-aluno-autenticado');
const erroLoginAluno = document.getElementById('erro-login-aluno');

const MESES_ANO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

let listaInstrumentos = [];
let listaAlunos = [];
let progressoAlunos = {};
let tarefasAlunos = {};
let mensalidadesAlunos = {};
let alunoLogadoId = null;

// Trava de segurança robusta contra concorrência (usada no drag e no clique dos checkboxes)
let bloqueiaAtualizacaoPorArrasto = false;

function obterChaveMesAtual() {
    const dataAtual = new Date();
    return `${dataAtual.getFullYear()}_${MESES_ANO[dataAtual.getMonth()]}`;
}

function obterNomeMesExibicao() {
    return MESES_ANO[new Date().getMonth()];
}

// Envia dados modificados ao Firebase
async function salvarNaNuvem() {
    const dados = { 
        instrumentos: listaInstrumentos, 
        alunos: listaAlunos, 
        progresso: progressoAlunos,
        tarefas: tarefasAlunos,
        mensalidades: mensalidadesAlunos
    };
    try {
        await fetch(`${DB_URL}.json`, { method: 'PUT', body: JSON.stringify(dados) });
    } catch (e) {
        console.error("Erro ao salvar dados no Firebase:", e);
    }
}

// Função centralizada para atualizar toda a estrutura do site instantaneamente
function recalcularEFatiazarInterfaceCompleta() {
    const atualFasesContainer = document.getElementById('fases-cronograma-container');
    const atualBarra = document.getElementById('progresso-barra-preenchimento');
    const atualTexto = document.getElementById('progresso-porcentagem');
    const atualTitulo = document.getElementById('nome-aluno-titulo');

    // 1. Atualiza listas internas, seletores e as listas de remoção em massa
    atualizarInterfaceGeral();

    // 2. Se for a página do aluno, renderiza a visão dele
    if(window.PAGINA_ALUNO && alunoLogadoId) {
        renderizarCronogramaAlunoId(alunoLogadoId, atualFasesContainer, atualBarra, atualTexto, atualTitulo);
        renderizarTarefasAluno(alunoLogadoId);
    } else if (!window.PAGINA_ALUNO) {
        // 3. Se for o painel admin, updates gerais
        const cursoSelecionado = seletorInstrumentoConfig ? seletorInstrumentoConfig.value : "";
        if(cursoSelecionado) {
            renderizarEstruturaCursoComTopicosAninhados(cursoSelecionado);
        }

        const alunoSelecionado = seletorAluno ? seletorAluno.value : "";
        if(alunoSelecionado) {
            renderizarCronogramaAlunoId(alunoSelecionado, atualFasesContainer, atualBarra, atualTexto, atualTitulo);
        }
        
        const alunoTarefaSelecionado = seletorAlunoTarefa ? seletorAlunoTarefa.value : "";
        if(alunoTarefaSelecionado) {
            renderizarTarefasAdmin(alunoTarefaSelecionado);
        }
    }
}

// Sincronização Ativa em Tempo Real
function escutarMudancasNaNuvem() {
    setInterval(async () => {
        if (bloqueiaAtualizacaoPorArrasto) return;

        try {
            const resposta = await fetch(`${DB_URL}.json`);
            const dados = await resposta.json();
            
            if(dados && !bloqueiaAtualizacaoPorArrasto) {
                listaInstrumentos = dados.instrumentos || [];
                listaAlunos = dados.alunos || [];
                progressoAlunos = dados.progresso || {};
                tarefasAlunos = dados.tarefas || {};
                mensalidadesAlunos = dados.mensalidades || {};
                
                recalcularEFatiazarInterfaceCompleta();
            }
        } catch (erro) {
            console.error("Erro na sincronização automática:", erro);
        }
    }, 2000);
}

function mudarAba(idAba) {
    document.querySelectorAll('.conteudo-aba').forEach(aba => aba.classList.remove('ativa'));
    document.querySelectorAll('.aba-btn').forEach(btn => btn.classList.remove('ativa'));
    if (window.event && window.event.currentTarget) window.event.currentTarget.classList.add('ativa');
    const targetAba = document.getElementById(idAba);
    if(targetAba) targetAba.classList.add('ativa');
}

function mudarAbaAluno(idSecao) {
    document.getElementById('secao-cronograma').style.display = 'none';
    document.getElementById('secao-tarefas').style.display = 'none';
    document.getElementById('btn-aba-cronograma').classList.remove('ativa');
    document.getElementById('btn-aba-tarefas').classList.remove('ativa');

    document.getElementById(idSecao).style.display = 'block';
    if(idSecao === 'secao-cronograma') document.getElementById('btn-aba-cronograma').classList.add('ativa');
    if(idSecao === 'secao-tarefas') document.getElementById('btn-aba-tarefas').classList.add('ativa');
}

function atualizarInterfaceGeral() {
    if (seletorInstrumentoConfig) {
        const valorCursoAtual = seletorInstrumentoConfig.value;
        seletorInstrumentoConfig.innerHTML = '<option value="">-- Selecione o Curso --</option>';
        listaInstrumentos.forEach(inst => {
            const opt = document.createElement('option'); opt.value = inst.id; opt.textContent = inst.nome; seletorInstrumentoConfig.appendChild(opt);
        });
        seletorInstrumentoConfig.value = valorCursoAtual;
    }
    
    if (seletorInstrumentoAluno) {
        seletorInstrumentoAluno.innerHTML = '<option value="">-- Vincular a qual Curso? --</option>';
        listaInstrumentos.forEach(inst => {
            const opt = document.createElement('option'); opt.value = inst.id; opt.textContent = inst.nome; seletorInstrumentoAluno.appendChild(opt);
        });
    }
    
    if (seletorInstrumentoFase) {
        const valorFaseAtual = seletorInstrumentoFase.value;
        seletorInstrumentoFase.innerHTML = '<option value="">-- Selecione o Curso --</option>';
        listaInstrumentos.forEach(inst => {
            const opt = document.createElement('option'); opt.value = inst.id; opt.textContent = inst.nome; seletorInstrumentoFase.appendChild(opt);
        });
        seletorInstrumentoFase.value = valorFaseAtual;
    }

    if (seletorAluno) {
        const valorAtual = seletorAluno.value;
        seletorAluno.innerHTML = '<option value="">-- Escolha um nome --</option>';
        if(seletorAlunoTarefa) seletorAlunoTarefa.innerHTML = '<option value="">-- Escolha um nome --</option>';
        
        listaAlunos.forEach(aluno => {
            const inst = listaInstrumentos.find(i => i.id === aluno.instrumentoId);
            const textoCombo = `${aluno.nome} (${inst ? inst.nome : 'Sem Curso'})`;
            
            const opt = document.createElement('option'); opt.value = aluno.id; opt.textContent = textoCombo;
            seletorAluno.appendChild(opt);

            if(seletorAlunoTarefa) {
                const optT = document.createElement('option'); optT.value = aluno.id; optT.textContent = textoCombo;
                seletorAlunoTarefa.appendChild(optT);
            }
        });
        seletorAluno.value = valorAtual;
    }
    renderizarListasMassaBackground();
    renderizarTabelaCodigosBackground();
}

function renderizarTabelaCodigosBackground() {
    if(!tabelaCodigosAlunos) return;
    let htmlGerado = '';
    if(listaAlunos.length === 0) { tabelaCodigosAlunos.innerHTML = '<p class="label-clean">Nenhum aluno matriculado.</p>'; return; }
    
    listaAlunos.forEach(al => {
        htmlGerado += `
            <div class="item-massa">
                <div>
                    <strong>${al.nome}</strong> 
                    <span style="background:var(--bg-card); padding:4px 10px; border-radius:6px; font-family:monospace; color:var(--cor-acento); margin-left:10px; border:1px solid rgba(255,255,255,0.04);">${al.codigo}</span>
                </div>
                <button class="btn-deletar-pequeno" onclick="editarAlunoAdmin('${al.id}')" style="color:var(--cor-acento); background:transparent;">Editar</button>
            </div>`;
    });
    tabelaCodigosAlunos.innerHTML = htmlGerado;
}

function renderizarListasMassaBackground() {
    if (listaInstrumentosExclusao) {
        let htmlInst = '';
        if (listaInstrumentos.length === 0) {
            htmlInst = '<p class="label-clean" style="padding:8px 0;">Nenhum curso cadastrado.</p>';
        } else {
            listaInstrumentos.forEach(ins => {
                htmlInst += `<div class="item-massa"><span style="display:flex; gap:10px; align-items:center;"><input type="checkbox" value="${ins.id}"> ${ins.nome}</span></div>`;
            });
        }
        listaInstrumentosExclusao.innerHTML = htmlInst;
    }
    
    if (listaAlunosExclusao) {
        let htmlAlunos = '';
        if (listaAlunos.length === 0) {
            htmlAlunos = '<p class="label-clean" style="padding:8px 0;">Nenhum aluno cadastrado.</p>';
        } else {
            listaAlunos.forEach(al => {
                const inst = listaInstrumentos.find(i => i.id === al.instrumentoId);
                const cursoNome = inst ? inst.nome : 'Sem Curso';
                htmlAlunos += `<div class="item-massa"><span style="display:flex; gap:10px; align-items:center;"><input type="checkbox" value="${al.id}"> ${al.nome} <small style="color:var(--cor-texto-secundario);">(${cursoNome})</small></span></div>`;
            });
        }
        listaAlunosExclusao.innerHTML = htmlAlunos;
    }
}

const gerarId = () => 'id_' + new Date().getTime();
const gerarCodigoAcesso = () => 'M' + Math.floor(100 + Math.random() * 900);

if (btnAddInstrumento) {
    btnAddInstrumento.addEventListener('click', async () => {
        const nome = inputNovoInstrumento.value.trim(); if(!nome) return;
        listaInstrumentos.push({ id: gerarId(), nome: nome, fases: [], topicos: [] });
        await salvarNaNuvem(); inputNovoInstrumento.value = ''; recalcularEFatiazarInterfaceCompleta();
    });
}

async function editarAlunoAdmin(alunoId) {
    const al = listaAlunos.find(a => a.id === alunoId);
    if(!al) return;
    const novoNome = prompt("Digite o novo nome do aluno:", al.nome);
    if(novoNome && novoNome.trim() !== "") {
        al.nome = novoNome.trim();
        await salvarNaNuvem(); recalcularEFatiazarInterfaceCompleta();
    }
}

if (btnAddFase) {
    btnAddFase.addEventListener('click', async () => {
        const instId = seletorInstrumentoFase.value; const nomeFase = inputNovaFase.value.trim();
        if(!instId || !nomeFase) return alert('Selecione o curso e digite a fase.');
        const inst = listaInstrumentos.find(i => i.id === instId);
        if(!inst.fases) inst.fases = [];
        if(inst.fases.includes(nomeFase)) return alert('Esta fase já existe.');
        inst.fases.push(nomeFase);
        await salvarNaNuvem(); inputNovaFase.value = ''; renderizarFasesAdmin(instId);
    });
}

if (seletorInstrumentoFase) {
    seletorInstrumentoFase.addEventListener('change', function() {
        renderizarFasesAdmin(this.value);
    });
}

if (seletorInstrumentoConfig) {
    seletorInstrumentoConfig.addEventListener('change', function() {
        atualizarSeletoresDeFaseDoCurso(this.value);
        renderizarEstruturaCursoComTopicosAninhados(this.value);
    });
}

function renderizarFasesAdmin(instId) {
    if(!listaFasesAtual) return; listaFasesAtual.innerHTML = '';
    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst || !inst.fases) return;
    
    inst.fases.forEach((fase) => {
        listaFasesAtual.innerHTML += `
        <li data-id="${fase}" style="cursor: grab;">
            <span>☰ ${fase}</span> 
            <div>
                <button class="btn-deletar-pequeno" style="color:var(--cor-acento); background:transparent;" onclick="editarFaseAdmin('${instId}', '${fase}')">Editar</button>
                <button class="btn-deletar-pequeno" onclick="deletarFaseAdmin('${instId}', '${fase}')">Excluir</button>
            </div>
        </li>`;
    });

    if(typeof Sortable !== 'undefined') {
        Sortable.create(listaFasesAtual, {
            animation: 150,
            onChoose: () => { bloqueiaAtualizacaoPorArrasto = true; },
            onEnd: async function () {
                bloqueiaAtualizacaoPorArrasto = true;
                const novaOrdem = Array.from(listaFasesAtual.children).map(li => li.getAttribute('data-id'));
                inst.fases = novaOrdem; 
                
                await salvarNaNuvem();
                recalcularEFatiazarInterfaceCompleta();
                
                setTimeout(() => { bloqueiaAtualizacaoPorArrasto = false; }, 3500);
            }
        });
    }
}

async function editarFaseAdmin(instId, faseAntiga) {
    const inst = listaInstrumentos.find(i => i.id === instId);
    const index = inst.fases.indexOf(faseAntiga);
    if(index === -1) return;
    
    const novaFase = prompt("Digite o novo nome da fase:", faseAntiga);
    if(novaFase && novaFase.trim() !== "") {
        inst.fases[index] = novaFase.trim();
        if(inst.topicos) {
            inst.topicos.forEach(t => { if(t && t.fase === faseAntiga) t.fase = novaFase.trim(); });
        }
        await salvarNaNuvem(); 
        renderizarFasesAdmin(instId);
        recalcularEFatiazarInterfaceCompleta();
    }
}

async function deletarFaseAdmin(instId, faseNome) {
    const inst = listaInstrumentos.find(i => i.id === instId);
    inst.fases = inst.fases.filter(f => f !== faseNome);
    if(inst.topicos) inst.topicos = inst.topicos.filter(t => t && t.fase !== faseNome);
    await salvarNaNuvem(); 
    renderizarFasesAdmin(instId);
    recalcularEFatiazarInterfaceCompleta();
}

function atualizarSeletoresDeFaseDoCurso(instId) {
    if(!seletorFaseTopico) return; seletorFaseTopico.innerHTML = '';
    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst || !inst.fases) return;
    inst.fases.forEach(f => { seletorFaseTopico.innerHTML += `<option value="${f}">${f}</option>`; });
}

function renderizarEstruturaCursoComTopicosAninhados(instId) {
    const containerConfig = document.getElementById('lista-topicos-atual');
    if(!containerConfig) return;
    containerConfig.innerHTML = '';

    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst) return;

    const ordemDasFases = inst.fases || [];
    const topicosDoCurso = inst.topicos || [];

    if(ordemDasFases.length === 0) {
        containerConfig.innerHTML = '<p class="label-clean">Cadastre primeiro as fases desse curso na aba ao lado.</p>';
        return;
    }

    ordemDasFases.forEach((nomeFase) => {
        const blocoFase = document.createElement('div');
        blocoFase.className = 'fase-bloco-config';
        blocoFase.style.border = '1px dashed var(--border)';
        blocoFase.style.padding = '15px';
        blocoFase.style.borderRadius = '10px';
        blocoFase.style.marginBottom = '15px';
        blocoFase.style.backgroundColor = 'rgba(255,255,255,0.01)';

        blocoFase.innerHTML = `<div style="font-weight:bold; color:var(--cor-acento); margin-bottom:10px; text-transform:uppercase; font-size:13px; letter-spacing:1px;">Fase: ${nomeFase}</div>`;
        
        const subListaUL = document.createElement('ul');
        subListaUL.style.listStyle = 'none';
        subListaUL.style.padding = '0';
        subListaUL.style.margin = '0';
        subListaUL.setAttribute('data-fase-nome', nomeFase);

        topicosDoCurso.forEach((topico) => {
            if(topico && topico.fase === nomeFase) {
                const itemLI = document.createElement('li');
                itemLI.className = 'item-tarefa';
                itemLI.setAttribute('data-topico-nome', topico.nome);
                itemLI.style.cursor = 'grab';
                itemLI.style.display = 'flex';
                itemLI.style.justifyContent = 'space-between';
                itemLI.style.alignItems = 'center';
                itemLI.style.padding = '10px';
                itemLI.style.marginBottom = '6px';
                itemLI.style.backgroundColor = 'var(--bg-principal)';

                itemLI.innerHTML = `
                    <span>☰ ${topico.nome}</span>
                    <div>
                        <button class="btn-deletar-pequeno" style="color:var(--cor-acento); background:transparent; margin-right:8px;" onclick="editarTopicoAninhado('${instId}', '${topico.nome}', '${nomeFase}')">Editar</button>
                        <button class="btn-deletar-pequeno" onclick="deletarTopicoAninhado('${instId}', '${topico.nome}', '${nomeFase}')">Excluir</button>
                    </div>
                `;
                subListaUL.appendChild(itemLI);
            }
        });

        if(subListaUL.children.length === 0) {
            subListaUL.innerHTML = '<p class="label-clean" style="font-size:12px; padding: 5px 0;">Nenhum tópico nesta fase.</p>';
        }

        blocoFase.appendChild(subListaUL);
        containerConfig.appendChild(blocoFase);

        if(typeof Sortable !== 'undefined' && subListaUL.children.length > 1) {
            Sortable.create(subListaUL, {
                animation: 150,
                handle: 'span',
                onStart: () => { 
                    bloqueiaAtualizacaoPorArrasto = true; 
                },
                onEnd: async function() {
                    bloqueiaAtualizacaoPorArrasto = true;

                    const nomesReordenados = Array.from(subListaUL.children)
                        .map(li => li.getAttribute('data-topico-nome'))
                        .filter(nome => nome !== null);

                    const topicosOutrasFases = inst.topicos.filter(t => t && t.fase !== nomeFase);

                    const topicosDestaFaseNovos = nomesReordenados.map(nome => {
                        return { nome: nome, fase: nomeFase };
                    });

                    inst.topicos = [...topicosOutrasFases, ...topicosDestaFaseNovos];
                    
                    await salvarNaNuvem();
                    recalcularEFatiazarInterfaceCompleta();
                    
                    setTimeout(() => {
                        bloqueiaAtualizacaoPorArrasto = false;
                    }, 3500);
                }
            });
        }
    });
}

function renderizarTopicosAdmin(instId) {
    renderizarEstruturaCursoComTopicosAninhados(instId);
}

async function editarTopicoAninhado(instId, nomeAntigo, faseNome) {
    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst || !inst.topicos) return;
    const topico = inst.topicos.find(t => t && t.nome === nomeAntigo && t.fase === faseNome);
    if(!topico) return;
    
    const novoNome = prompt("Digite o novo nome do tópico:", topico.nome);
    if(novoNome && novoNome.trim() !== "") {
        topico.nome = novoNome.trim();
        await salvarNaNuvem(); 
        recalcularEFatiazarInterfaceCompleta();
    }
}

async function deletarTopicoAninhado(instId, nomeTopico, faseNome) {
    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst || !inst.topicos) return;
    inst.topicos = inst.topicos.filter(t => t && !(t.nome === nomeTopico && t.fase === faseNome));
    await salvarNaNuvem(); 
    recalcularEFatiazarInterfaceCompleta();
}

if(btnAddTopico) {
    btnAddTopico.addEventListener('click', async () => {
        const id = seletorInstrumentoConfig.value; const nome = inputNovoTopico.value.trim(); const fase = seletorFaseTopico.value;
        if(!id || !nome || !fase) return alert('Escolha os dados completando os seletores!');
        const inst = listaInstrumentos.find(i => i.id === id);
        if(!inst.topicos) inst.topicos = [];
        inst.topicos.push({ nome: nome, fase: fase });
        await salvarNaNuvem(); inputNovoTopico.value = ''; 
        recalcularEFatiazarInterfaceCompleta();
    });
}

if(btnAdicionarAluno) {
    btnAdicionarAluno.addEventListener('click', async () => {
        const nome = inputNovoAlunoNome.value.trim(); const instId = seletorInstrumentoAluno.value;
        if(!nome || !instId) return alert('Preencha os campos!');
        listaAlunos.push({ id: gerarId(), nome: nome, instrumentoId: instId, codigo: gerarCodigoAcesso() });
        await salvarNaNuvem(); inputNovoAlunoNome.value = ''; 
        recalcularEFatiazarInterfaceCompleta();
        alert('Aluno matriculado!');
    });
}

if(btnRemoverAlunosMassa) {
    btnRemoverAlunosMassa.addEventListener('click', async () => {
        const marcados = [...listaAlunosExclusao.querySelectorAll('input:checked')].map(c => c.value);
        if(marcados.length === 0) return alert('Selecione ao menos um aluno para remover.');
        if(confirm('Remover alunos selecionados?')) {
            listaAlunos = listaAlunos.filter(a => !marcados.includes(a.id));
            await salvarNaNuvem(); recalcularEFatiazarInterfaceCompleta();
        }
    });
}

if(btnRemoverInstrumentosMassa) {
    btnRemoverInstrumentosMassa.addEventListener('click', async () => {
        const marcados = [...listaInstrumentosExclusao.querySelectorAll('input:checked')].map(c => c.value);
        if(marcados.length === 0) return alert('Selecione ao menos um curso para remover.');
        if(confirm('Excluir matérias selecionadas?')) {
            listaInstrumentos = listaInstrumentos.filter(i => !marcados.includes(i.id));
            await salvarNaNuvem(); recalcularEFatiazarInterfaceCompleta();
        }
    });
}

if(btnAddTarefa) {
    btnAddTarefa.addEventListener('click', async () => {
        const alunoId = seletorAlunoTarefa.value; const texto = txtNovaTarefa.value.trim(); const data = dateNovaTarefa.value;
        if(!alunoId || !texto || !data) return alert('Por favor, preencha a tarefa!');
        if(!tarefasAlunos[alunoId]) tarefasAlunos[alunoId] = [];
        tarefasAlunos[alunoId].push({ id: 't_id_' + new Date().getTime(), texto: texto, dataEntrega: data, status: 'Pendente' });
        await salvarNaNuvem(); txtNovaTarefa.value = ''; dateNovaTarefa.value = ''; renderizarTarefasAdmin(alunoId); alert('Tarefa lançada!');
    });
}

if (seletorAlunoTarefa) {
    seletorAlunoTarefa.addEventListener('change', function() {
        renderizarTarefasAdmin(this.value);
    });
}

function renderizarTarefasAdmin(alunoId) {
    if(!listaTarefasAdminContainer) return; 
    if(!alunoId) { listaTarefasAdminContainer.innerHTML = '<p class="label-clean">Selecione um aluno acima.</p>'; return; }
    const tareas = tarefasAlunos[alunoId] || [];
    if(tareas.length === 0) { listaTarefasAdminContainer.innerHTML = '<p class="label-clean">Nenhuma atividade pendente.</p>'; return; }

    let htmlTarefas = '';
    tareas.forEach((tarefa) => {
        const dataFormatada = tarefa.dataEntrega.split('-').reverse().join('/');
        const statusAtual = tarefa.status || 'Pendente';

        htmlTarefas += `
            <div class="item-tarefa">
                <div style="flex:1;">
                    <p style="margin:0; font-size:14px;">${tarefa.texto}</p>
                    <small style="color:var(--cor-texto-secundario);">📅 Prazo: ${dataFormatada}</small>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <select onchange="mudarStatusTarefaBanco('${alunoId}', '${tarefa.id}', this.value)" style="padding:6px; font-size:12px; width:auto;">
                        <option value="Pendente" ${statusAtual === 'Pendente' ? 'selected':''}>⏳ Analisando</option>
                        <option value="Concluido" ${statusAtual === 'Concluido' ? 'selected':''}>✓ Concluído</option>
                        <option value="NaoFeito" ${statusAtual === 'NaoFeito' ? 'selected':''}>❌ Recusado</option>
                    </select>
                    <button class="btn-deletar-pequeno" onclick="deletarTarefa('${alunoId}', '${tarefa.id}')">X</button>
                </div>
            </div>`;
    });
    if(listaTarefasAdminContainer.innerHTML !== htmlTarefas) listaTarefasAdminContainer.innerHTML = htmlTarefas;
}

async function mudarStatusTarefaBanco(alunoId, tarefaId, novoStatus) {
    const tarefa = tarefasAlunos[alunoId].find(t => t.id === tarefaId);
    if(tarefa) { tarefa.status = novoStatus; await salvarNaNuvem(); renderizarTarefasAdmin(alunoId); }
}

async function deletarTarefa(alunoId, tarefaId) {
    if(confirm('Apagar essa tarefa?')) {
        tarefasAlunos[alunoId] = tarefasAlunos[alunoId].filter(t => t.id !== tarefaId);
        await salvarNaNuvem(); renderizarTarefasAdmin(alunoId);
    }
}

function gerenciarRenderizacaoMensalidadeAdmin(alunoId) {
    if(!btnAlternarPagamento || !labelMesAtual) return;
    if(!alunoId) { document.getElementById('bloco-status-mensalidade-admin').style.display = 'none'; return; }
    
    document.getElementById('bloco-status-mensalidade-admin').style.display = 'flex';
    const mesChave = obterChaveMesAtual();
    labelMesAtual.innerText = `${obterNomeMesExibicao()}:`;

    if(!mensalidadesAlunos[alunoId]) mensalidadesAlunos[alunoId] = {};
    const estaPago = mensalidadesAlunos[alunoId][mesChave] === true;

    if(estaPago) {
        btnAlternarPagamento.className = "selo-mensalidade pago";
        btnAlternarPagamento.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px">check_circle</span> Pago`;
    } else {
        btnAlternarPagamento.className = "selo-mensalidade pendente";
        btnAlternarPagamento.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px">pending</span> Aberto`;
    }

    btnAlternarPagamento.onclick = async () => {
        mensalidadesAlunos[alunoId][mesChave] = !estaPago;
        await salvarNaNuvem();
        gerenciarRenderizacaoMensalidadeAdmin(alunoId);
    };
}

function gerenciarRenderizacaoMensalidadeAluno(alunoId) {
    const tagM = document.getElementById('tag-mensalidade-aluno');
    if(!tagM) return;
    const mesChave = obterChaveMesAtual();
    const nomeMes = obterNomeMesExibicao();
    const estaPago = (mensalidadesAlunos[alunoId] || {})[mesChave] === true;

    if(estaPago) {
        tagM.className = "selo-mensalidade pago";
        tagM.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px">check_circle</span> ${nomeMes} Ok`;
    } else {
        tagM.className = "selo-mensalidade pendente";
        tagM.innerHTML = `<span class="material-symbols-rounded" style="font-size:16px">pending</span> ${nomeMes} Pendente`;
    }
}

function renderizarTarefasAluno(alunoId) {
    if(!listaTarefasAlunoContainer) return;
    const items = tarefasAlunos[alunoId] || [];
    if(items.length === 0) { listaTarefasAlunoContainer.innerHTML = '<p class="label-clean">🎉 Sem pendências ou tarefas!</p>'; return; }

    let htmlAlunoTarefas = '';
    items.forEach(tarefa => {
        const status = tarefa.status || 'Pendente';
        let colStatus = 'var(--cor-acento)', textStatus = "⏳ Em Análise";
        
        if(status === 'Concluido') { colStatus = 'var(--cor-sucesso)'; textStatus = "✓ Concluído"; }
        if(status === 'NaoFeito') { colStatus = 'var(--cor-perigo)'; textStatus = "❌ Refazer"; }

        const dataFormatada = tarefa.dataEntrega.split('-').reverse().join('/');
        htmlAlunoTarefas += `
            <div class="item-tarefa">
                <div style="width:100%">
                    <p style="margin:0; font-size:14px; color:var(--cor-texto);">${tarefa.texto}</p>
                    <div style="margin-top:6px; display:flex; justify-content:space-between; font-size:11px;">
                        <span style="color:var(--cor-texto-secundario);">📅 Limite: ${dataFormatada}</span>
                        <strong style="color:${colStatus}">${textStatus}</strong>
                    </div>
                </div>
            </div>`;
    });
    if(listaTarefasAlunoContainer.innerHTML !== htmlAlunoTarefas) listaTarefasAlunoContainer.innerHTML = htmlAlunoTarefas;
}

if(btnEntrarAluno) {
    btnEntrarAluno.addEventListener('click', () => {
        const codigoDigitado = inputCodigoAluno.value.trim().toUpperCase(); if(!codigoDigitado) return;
        const al = listaAlunos.find(a => a.codigo === codigoDigitado);

        if(al) {
            alunoLogadoId = al.id;
            erroLoginAluno.style.display = 'none'; blocoLoginAluno.style.display = 'none'; conteudoAlunoAutenticado.style.display = 'block';
            localStorage.setItem('escola_musica_codigo_aluno', codigoDigitado);
            recalcularEFatiazarInterfaceCompleta();
        } else {
            erroLoginAluno.style.display = 'block';
        }
    });
}

if(seletorAluno) {
    seletorAluno.addEventListener('change', function() { 
        const container = document.getElementById('fases-cronograma-container');
        const barra = document.getElementById('progresso-barra-preenchimento');
        const texto = document.getElementById('progresso-porcentagem');
        const titulo = document.getElementById('nome-aluno-titulo');
        renderizarCronogramaAlunoId(this.value, container, barra, texto, titulo); 
    });
}

function calcularProgresso(alunoId, topicos) {
    if(!topicos || topicos.length === 0) return 0;
    let checados = 0;
    topicos.forEach(t => {
        if(t) {
            const chave = `${alunoId}-t4-${t.fase}-${t.nome}`.replace(/\s+/g, '_');
            if(progressoAlunos[chave] === true || progressoAlunos[chave] === 'true') checados++;
        }
    });
    return Math.round((checados / topicos.length) * 100);
}

function renderizarCronogramaAlunoId(alunoId, container, barra, texto, tituloElement) {
    if(!container) return;
    
    if(!window.PAGINA_ALUNO) gerenciarRenderizacaoMensalidadeAdmin(alunoId);
    else gerenciarRenderizacaoMensalidadeAluno(alunoId);

    if(!alunoId) { container.innerHTML = ''; return; }

    const aluno = listaAlunos.find(a => a.id === alunoId);
    if (!aluno) return;
    const inst = listaInstrumentos.find(i => i.id === aluno.instrumentoId);
    if(tituloElement) tituloElement.innerText = aluno.nome;

    if(!inst || !inst.topicos || inst.topicos.length === 0) {
        container.innerHTML = '<p class="label-clean" style="padding:10px;">Sem tópicos vinculados.</p>';
        if(barra) barra.style.width = '0%'; 
        if(texto) texto.innerText = '0%'; 
        return;
    }

    let estadoAtualString = "";
    const ordemDasFases = inst.fases || [];
    const fasesAgrupadas = {};
    ordemDasFases.forEach(f => fasesAgrupadas[f] = []);
    inst.topicos.forEach(t => { if(t && fasesAgrupadas[t.fase]) fasesAgrupadas[t.fase].push(t); });

    ordemDasFases.forEach(nomeFase => {
        if(!fasesAgrupadas[nomeFase] || fasesAgrupadas[nomeFase].length === 0) return;
        fasesAgrupadas[nomeFase].forEach(topico => {
            const chaveSalva = `${alunoId}-t4-${topico.fase}-${topico.nome}`.replace(/\s+/g, '_');
            const checked = progressoAlunos[chaveSalva] === true || progressoAlunos[chaveSalva] === 'true';
            estadoAtualString += `${chaveSalva}:${checked}|`;
        });
    });

    // CORREÇÃO: Evita travar o clique da checkbox se a trava de concorrência estiver ativa temporariamente
    if (container.dataset.estadoAtual === estadoAtualString && !bloqueiaAtualizacaoPorArrasto) {
        const pct = calcularProgresso(alunoId, inst.topicos);
        if(barra) barra.style.width = pct + '%'; 
        if(texto) texto.innerText = pct + '%';
        return;
    }
    container.dataset.estadoAtual = estadoAtualString;
    container.innerHTML = '';

    ordemDasFases.forEach(nomeFase => {
        if(!fasesAgrupadas[nomeFase] || fasesAgrupadas[nomeFase].length === 0) return;
        const bloco = document.createElement('div'); bloco.className = 'fase-bloco';
        bloco.innerHTML = `<div class="fase-titulo">${nomeFase}</div>`;

        fasesAgrupadas[nomeFase].forEach(topico => {
            const chaveSalva = `${alunoId}-t4-${topico.fase}-${topico.nome}`.replace(/\s+/g, '_');
            const checked = progressoAlunos[chaveSalva] === true || progressoAlunos[chaveSalva] === 'true';

            const item = document.createElement('div'); item.className = 'item-tarefa';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = checked;
            if (window.PAGINA_ALUNO) cb.disabled = true;

            const span = document.createElement('span'); span.textContent = topico.nome;
            if(checked) span.className = 'concluido';

            if (!window.PAGINA_ALUNO) {
                cb.addEventListener('change', async function() {
                    // CORREÇÃO CRUCIAL: Trava temporariamente o cronômetro automático do Firebase
                    // para dar tempo de salvar o novo estado sem que a tela seja redefinida com dados antigos
                    bloqueiaAtualizacaoPorArrasto = true;

                    progressoAlunos[chaveSalva] = this.checked;
                    span.className = this.checked ? 'concluido' : '';
                    
                    const pct = calcularProgresso(alunoId, inst.topicos);
                    if(barra) barra.style.width = pct + '%'; 
                    if(texto) texto.innerText = pct + '%';
                    
                    await salvarNaNuvem();
                    
                    // Atualiza a string local do estado para alinhar a interface
                    container.dataset.estadoAtual = container.dataset.estadoAtual.replace(
                        `${chaveSalva}:${!this.checked}`, 
                        `${chaveSalva}:${this.checked}`
                    );

                    // Libera o cronômetro automático após 3 segundos
                    setTimeout(() => {
                        bloqueiaAtualizacaoPorArrasto = false;
                    }, 3000);
                });
            }

            item.appendChild(cb); item.appendChild(span); bloco.appendChild(item);
        });
        container.appendChild(bloco);
    });

    const pctInicial = calcularProgresso(alunoId, inst.topicos);
    if(barra) barra.style.width = pctInicial + '%'; 
    if(texto) texto.innerText = pctInicial + '%';
}

// Inicializador
window.onload = async function() {
    try {
        const resposta = await fetch(`${DB_URL}.json`);
        const dados = await resposta.json();
        if(dados) {
            listaInstrumentos = dados.instrumentos || [];
            listaAlunos = dados.alunos || [];
            progressoAlunos = dados.progresso || {};
            tarefasAlunos = dados.tarefas || {};
            mensalidadesAlunos = dados.mensalidades || {};
        }
    } catch(e) { console.error("Erro na carga inicial: ", e); }
    
    recalcularEFatiazarInterfaceCompleta();

    if(window.PAGINA_ALUNO) {
        const codigoSalvo = localStorage.getItem('escola_musica_codigo_aluno');
        if (codigoSalvo && inputCodigoAluno) {
            inputCodigoAluno.value = codigoSalvo;
            const al = listaAlunos.find(a => a.codigo === codigoSalvo);
            if(al) {
                alunoLogadoId = al.id;
                blocoLoginAluno.style.display = 'none';
                conteudoAlunoAutenticado.style.display = 'block';
                recalcularEFatiazarInterfaceCompleta();
            }
        }
    }

    escutarMudancasNaNuvem();
};
