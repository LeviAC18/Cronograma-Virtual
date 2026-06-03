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
const inputNovaFase = document.getElementById('nova-fase-nome');
const btnAddFase = document.getElementById('btn-add-fase');
const seletorInstrumentoConfig = document.getElementById('seletor-instrumento-config');
const listaFasesUnificada = document.getElementById('lista-fases-unificada');
const blocoConstrutorFases = document.getElementById('bloco-construtor-fases');
const msgSemCurso = document.getElementById('msg-sem-curso');

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
const btnAddTarefa = document.getElementById('btn-add-technologia'); 
const listaTarefasAdminContainer = document.getElementById('lista-tarefas-admin-container');
const listaTarefasAlunoContainer = document.getElementById('lista-tarefas-aluno-container');

// Mapeamento do elemento de persistência manual
const btnSalvarGeral = document.getElementById('btn-salvar-geral');

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

function obterChaveMesAtual() {
    const dataAtual = new Date();
    return `${dataAtual.getFullYear()}_${MESES_ANO[dataAtual.getMonth()]}`;
}

function obterNomeMesExibicao() {
    return MESES_ANO[new Date().getMonth()];
}

// ATUALIZAÇÃO CENTRALIZADA: Executada estritamente sob demanda pelo botão "Salvar"
async function salvarNaNuvem() {
    if (btnSalvarGeral) {
        btnSalvarGeral.disabled = true;
        btnSalvarGeral.innerHTML = `<span class="material-symbols-rounded">sync</span> Atualizando Nuvem...`;
        btnSalvarGeral.style.opacity = "0.7";
    }

    const dados = { 
        instrumentos: listaInstrumentos, 
        alunos: listaAlunos, 
        progresso: progressoAlunos,
        tarefas: tarefasAlunos,
        mensalidades: mensalidadesAlunos
    };

    try {
        await fetch(`${DB_URL}.json`, { method: 'PUT', body: JSON.stringify(dados) });
        
        if (btnSalvarGeral) {
            btnSalvarGeral.innerHTML = `<span class="material-symbols-rounded">cloud_done</span> Sincronizado com Sucesso!`;
            btnSalvarGeral.style.background = "var(--cor-sucesso)";
            btnSalvarGeral.style.color = "#121418";
            
            setTimeout(() => {
                btnSalvarGeral.disabled = false;
                btnSalvarGeral.innerHTML = `<span class="material-symbols-rounded">save</span> Salvar Alterações na Nuvem`;
                btnSalvarGeral.style.background = "var(--cor-acento)";
                btnSalvarGeral.style.color = "var(--bg-principal)";
                btnSalvarGeral.style.opacity = "1";
            }, 2500);
        }
    } catch (e) {
        console.error("Erro ao salvar dados no Firebase:", e);
        alert("Falha de comunicação com o servidor ao salvar.");
        if (btnSalvarGeral) {
            btnSalvarGeral.disabled = false;
            btnSalvarGeral.innerHTML = `<span class="material-symbols-rounded">save</span> Tentar Salvar Novamente`;
            btnSalvarGeral.style.background = "var(--cor-perigo)";
        }
    }
}

function recalcularEFatiazarInterfaceCompleta() {
    const atualFasesContainer = document.getElementById('fases-cronograma-container');
    const atualBarra = document.getElementById('progresso-barra-preenchimento');
    const atualTexto = document.getElementById('progresso-porcentagem');
    const atualTitulo = document.getElementById('nome-aluno-titulo');

    atualizarInterfaceGeral();

    if(window.PAGINA_ALUNO && alunoLogadoId) {
        renderizarCronogramaAlunoId(alunoLogadoId, atualFasesContainer, atualBarra, atualTexto, atualTitulo);
        renderizarTarefasAluno(alunoLogadoId);
    } else if (!window.PAGINA_ALUNO) {
        const cursoSelecionado = seletorInstrumentoConfig ? seletorInstrumentoConfig.value : "";
        if(cursoSelecionado) {
            renderizarEstruturaUnificadaCurso(cursoSelecionado);
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

// CONTROLE SELETIVO DE SESSÃO: Sincronização contínua apenas na ponta do Aluno
function escutarMudancasNaNuvem() {
    if (!window.PAGINA_ALUNO) return;

    setInterval(async () => {
        try {
            const resposta = await fetch(`${DB_URL}.json`);
            const dados = await resposta.json();
            
            if(dados) {
                listaInstrumentos = dados.instrumentos || [];
                listaAlunos = dados.alunos || [];
                progressoAlunos = dados.progresso || {};
                tarefasAlunos = dados.tarefas || {};
                mensalidadesAlunos = dados.mensalidades || {};
                
                recalcularEFatiazarInterfaceCompleta();
            }
        } catch (erro) {
            console.error("Erro na sincronização em tempo real do aluno:", erro);
        }
    }, 3000);
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
        
        if (valorCursoAtual) {
            if (blocoConstrutorFases) blocoConstrutorFases.style.display = 'block';
            if (msgSemCurso) msgSemCurso.style.display = 'none';
        } else {
            if (blocoConstrutorFases) blocoConstrutorFases.style.display = 'none';
            if (msgSemCurso) msgSemCurso.style.display = 'block';
        }
    }
    
    if (seletorInstrumentoAluno) {
        seletorInstrumentoAluno.innerHTML = '<option value="">-- Vincular a qual Curso? --</option>';
        listaInstrumentos.forEach(inst => {
            const opt = document.createElement('option'); opt.value = inst.id; opt.textContent = inst.nome; seletorInstrumentoAluno.appendChild(opt);
        });
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
    btnAddInstrumento.addEventListener('click', () => {
        const nome = inputNovoInstrumento.value.trim(); if(!nome) return;
        listaInstrumentos.push({ id: gerarId(), nome: nome, fases: [], topicos: [] });
        inputNovoInstrumento.value = ''; 
        recalcularEFatiazarInterfaceCompleta();
    });
}

function editarAlunoAdmin(alunoId) {
    const al = listaAlunos.find(a => a.id === alunoId);
    if(!al) return;
    const novoNome = prompt("Digite o novo nome do aluno:", al.nome);
    if(novoNome && novoNome.trim() !== "") {
        al.nome = novoNome.trim();
        recalcularEFatiazarInterfaceCompleta();
    }
}

// CONSTRUTOR DINÂMICO E UNIFICADO: FASES + TÓPICOS ANINHADOS
if (seletorInstrumentoConfig) {
    seletorInstrumentoConfig.addEventListener('change', function() {
        const idCurso = this.value;
        if(idCurso) {
            blocoConstrutorFases.style.display = 'block';
            msgSemCurso.style.display = 'none';
            renderizarEstruturaUnificadaCurso(idCurso);
        } else {
            blocoConstrutorFases.style.display = 'none';
            msgSemCurso.style.display = 'block';
        }
    });
}

if (btnAddFase) {
    btnAddFase.addEventListener('click', () => {
        const instId = seletorInstrumentoConfig.value; const nomeFase = inputNovaFase.value.trim();
        if(!instId || !nomeFase) return alert('Por favor, digite o nome da fase.');
        const inst = listaInstrumentos.find(i => i.id === instId);
        if(!inst.fases) inst.fases = [];
        if(inst.fases.includes(nomeFase)) return alert('Esta fase já existe neste curso.');
        inst.fases.push(nomeFase);
        inputNovaFase.value = ''; 
        renderizarEstruturaUnificadaCurso(instId);
    });
}

function renderizarEstruturaUnificadaCurso(instId) {
    if(!listaFasesUnificada) return;
    listaFasesUnificada.innerHTML = '';

    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst) return;

    const ordemDasFases = inst.fases || [];
    const topicosDoCurso = inst.topicos || [];

    if(ordemDasFases.length === 0) {
        listaFasesUnificada.innerHTML = '<p class="label-clean" style="text-align:center; padding: 20px 0;">Nenhuma fase criada neste curso ainda.</p>';
        return;
    }

    ordemDasFases.forEach((nomeFase) => {
        const itemFaseLI = document.createElement('li');
        itemFaseLI.setAttribute('data-fase-id', nomeFase);
        itemFaseLI.style.display = 'block';
        itemFaseLI.style.background = 'var(--bg-card)';
        itemFaseLI.style.border = '1px solid rgba(255,255,255,0.04)';
        itemFaseLI.style.padding = '16px';
        itemFaseLI.style.borderRadius = '14px';
        itemFaseLI.style.marginBottom = '15px';
        itemFaseLI.style.cursor = 'default';

        // Cabeçalho Controle da Fase
        const cabecalhoFase = document.createElement('div');
        cabecalhoFase.style.display = 'flex';
        cabecalhoFase.style.justifyContent = 'space-between';
        cabecalhoFase.style.alignItems = 'center';
        cabecalhoFase.style.marginBottom = '12px';

        cabecalhoFase.innerHTML = `
            <span style="font-weight:600; color:var(--cor-acento); font-size:14px; cursor:grab;" class="handle-fase">☰ FASE: ${nomeFase}</span>
            <div style="display:flex; gap:6px;">
                <button class="btn-deletar-pequeno" style="color:var(--cor-acento); background:transparent;" onclick="editarFaseUnificada('${instId}', '${nomeFase}')">Editar</button>
                <button class="btn-deletar-pequeno" onclick="deletarFaseUnificada('${instId}', '${nomeFase}')">Excluir</button>
            </div>
        `;
        itemFaseLI.appendChild(cabecalhoFase);

        // Sublista interna de Tópicos
        const subListaTopicosUL = document.createElement('ul');
        subListaTopicosUL.style.listStyle = 'none';
        subListaTopicosUL.style.padding = '0';
        subListaTopicosUL.style.margin = '10px 0';
        subListaTopicosUL.setAttribute('data-fase-vinculo', nomeFase);

        topicosDoCurso.forEach((topico) => {
            if(topico && topico.fase === nomeFase) {
                const itemTopicoLI = document.createElement('li');
                itemTopicoLI.setAttribute('data-topico-nome', topico.nome);
                itemTopicoLI.style.background = 'var(--bg-principal)';
                itemTopicoLI.style.padding = '10px 14px';
                itemTopicoLI.style.borderRadius = '8px';
                itemTopicoLI.style.marginBottom = '6px';
                itemTopicoLI.style.display = 'flex';
                itemTopicoLI.style.justifyContent = 'space-between';
                itemTopicoLI.style.alignItems = 'center';
                itemTopicoLI.style.border = '1px solid rgba(255,255,255,0.02)';

                itemTopicoLI.innerHTML = `
                    <span style="font-size:13px; cursor:grab;">☰ ${topico.nome}</span>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-deletar-pequeno" style="color:var(--cor-acento); background:transparent; padding:2px 6px; font-size:11px;" onclick="editarTopicoUnificado('${instId}', '${topico.nome}', '${nomeFase}')">Editar</button>
                        <button class="btn-deletar-pequeno" style="padding:2px 6px; font-size:11px;" onclick="deletarTopicoUnificado('${instId}', '${topico.nome}', '${nomeFase}')">Excluir</button>
                    </div>
                `;
                subListaTopicosUL.appendChild(itemTopicoLI);
            }
        });

        if(subListaTopicosUL.children.length === 0) {
            subListaTopicosUL.innerHTML = '<p class="label-clean" style="font-size:12px; padding:6px; text-align:center; border: 1px dashed rgba(255,255,255,0.03); border-radius:6px;">Nenhum conteúdo/tópico nesta fase.</p>';
        }

        itemFaseLI.appendChild(subListaTopicosUL);

        // Formulário Compacto para Inserir Tópico Direto na Fase
        const containerAcaoRapida = document.createElement('div');
        containerAcaoRapida.style.display = 'flex';
        containerAcaoRapida.style.gap = '8px';
        containerAcaoRapida.style.marginTop = '10px';

        const inputRapido = document.createElement('input');
        inputRapido.type = 'text';
        inputRapido.placeholder = 'Adicionar tópico nesta fase...';
        inputRapido.style.fontSize = '12px';
        inputRapido.style.padding = '8px 12px';
        inputRapido.style.flex = '1';

        const btnRapido = document.createElement('button');
        btnRapido.className = 'btn-acao';
        btnRapido.textContent = '+ Tópico';
        btnRapido.style.width = 'auto';
        btnRapido.style.padding = '0 14px';
        btnRapido.style.fontSize = '12px';

        btnRapido.onclick = () => {
            const textoTopico = inputRapido.value.trim();
            if(!textoTopico) return;
            if(!inst.topicos) inst.topicos = [];
            inst.topicos.push({ nome: textoTopico, fase: nomeFase });
            inputRapido.value = '';
            renderizarEstruturaUnificadaCurso(instId);
        };

        containerAcaoRapida.appendChild(inputRapido);
        containerAcaoRapida.appendChild(btnRapido);
        itemFaseLI.appendChild(containerAcaoRapida);

        listaFasesUnificada.appendChild(itemFaseLI);

        // Sortable nos Tópicos (Interno)
        if(typeof Sortable !== 'undefined' && subListaTopicosUL.querySelectorAll('[data-topico-nome]').length > 1) {
            Sortable.create(subListaTopicosUL, {
                animation: 150,
                handle: 'span',
                onEnd: function() {
                    const nomesReordenados = Array.from(subListaTopicosUL.children)
                        .map(li => li.getAttribute('data-topico-nome'))
                        .filter(n => n !== null);

                    const topicosOutrasFases = inst.topicos.filter(t => t && t.fase !== nomeFase);
                    const topicosDestaFaseNovos = nomesReordenados.map(nome => {
                        return { nome: nome, fase: nomeFase };
                    });

                    inst.topicos = [...topicosOutrasFases, ...topicosDestaFaseNovos];
                }
            });
        }
    });

    // Sortable nas Fases (Geral)
    if(typeof Sortable !== 'undefined') {
        Sortable.create(listaFasesUnificada, {
            animation: 150,
            handle: '.handle-fase',
            onEnd: function () {
                const novaOrdemFases = Array.from(listaFasesUnificada.children).map(li => li.getAttribute('data-fase-id')).filter(f => f !== null);
                inst.fases = novaOrdemFases;
            }
        });
    }
}

function editarFaseUnificada(instId, faseAntiga) {
    const inst = listaInstrumentos.find(i => i.id === instId);
    const index = inst.fases.indexOf(faseAntiga);
    if(index === -1) return;
    
    const novaFase = prompt("Digite o novo nome da fase:", faseAntiga);
    if(novaFase && novaFase.trim() !== "") {
        inst.fases[index] = novaFase.trim();
        if(inst.topicos) {
            inst.topicos.forEach(t => { if(t && t.fase === faseAntiga) t.fase = novaFase.trim(); });
        }
        renderizarEstruturaUnificadaCurso(instId);
    }
}

function deletarFaseUnificada(instId, faseNome) {
    if(confirm(`Tem certeza que deseja excluir a fase "${faseNome}" e todos os seus tópicos internos?`)) {
        const inst = listaInstrumentos.find(i => i.id === instId);
        inst.fases = inst.fases.filter(f => f !== faseNome);
        if(inst.topicos) inst.topicos = inst.topicos.filter(t => t && t.fase !== faseNome);
        renderizarEstruturaUnificadaCurso(instId);
    }
}

function editarTopicoUnificado(instId, nomeAntigo, faseNome) {
    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst || !inst.topicos) return;
    const topico = inst.topicos.find(t => t && t.nome === nomeAntigo && t.fase === faseNome);
    if(!topico) return;
    
    const novoNome = prompt("Digite o novo nome do tópico:", topico.nome);
    if(novoNome && novoNome.trim() !== "") {
        topico.nome = novoNome.trim();
        renderizarEstruturaUnificadaCurso(instId);
    }
}

function deletarTopicoUnificado(instId, nomeTopico, faseNome) {
    const inst = listaInstrumentos.find(i => i.id === instId);
    if(!inst || !inst.topicos) return;
    inst.topicos = inst.topicos.filter(t => t && !(t.nome === nomeTopico && t.fase === faseNome));
    renderizarEstruturaUnificadaCurso(instId);
}

if(btnAdicionarAluno) {
    btnAdicionarAluno.addEventListener('click', () => {
        const nome = inputNovoAlunoNome.value.trim(); const instId = seletorInstrumentoAluno.value;
        if(!nome || !instId) return alert('Preencha os campos!');
        listaAlunos.push({ id: gerarId(), nome: nome, instrumentoId: instId, codigo: gerarCodigoAcesso() });
        inputNovoAlunoNome.value = ''; 
        recalcularEFatiazarInterfaceCompleta();
        alert('Aluno inserido no painel local! Lembre-se de salvar na nuvem.');
    });
}

if(btnRemoverAlunosMassa) {
    btnRemoverAlunosMassa.addEventListener('click', () => {
        const marcados = [...listaAlunosExclusao.querySelectorAll('input:checked')].map(c => c.value);
        if(marcados.length === 0) return alert('Selecione ao menos um aluno para remover.');
        if(confirm('Remover alunos selecionados da lista local?')) {
            listaAlunos = listaAlunos.filter(a => !marcados.includes(a.id));
            recalcularEFatiazarInterfaceCompleta();
        }
    });
}

if(btnRemoverInstrumentosMassa) {
    btnRemoverInstrumentosMassa.addEventListener('click', () => {
        const marcados = [...listaInstrumentosExclusao.querySelectorAll('input:checked')].map(c => c.value);
        if(marcados.length === 0) return alert('Selecione ao menos um curso para remover.');
        if(confirm('Excluir matérias selecionadas da lista local?')) {
            listaInstrumentos = listaInstrumentos.filter(i => !marcados.includes(i.id));
            recalcularEFatiazarInterfaceCompleta();
        }
    });
}

if(btnAddTarget || btnAddTarefa) {
    const targetBtn = btnAddTarefa;
    targetBtn.addEventListener('click', () => {
        const alunoId = seletorAlunoTarefa.value; const texto = txtNovaTarefa.value.trim(); const data = dateNovaTarefa.value;
        if(!alunoId || !texto || !data) return alert('Por favor, preencha a tarefa!');
        if(!tarefasAlunos[alunoId]) tarefasAlunos[alunoId] = [];
        tarefasAlunos[alunoId].push({ id: 't_id_' + new Date().getTime(), texto: texto, dataEntrega: data, status: 'Pendente' });
        txtNovaTarefa.value = ''; dateNovaTarefa.value = ''; 
        renderizarTarefasAdmin(alunoId);
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
                    <select onchange="mudarStatusTarefaLocal('${alunoId}', '${tarefa.id}', this.value)" style="padding:6px; font-size:12px; width:auto;">
                        <option value="Pendente" ${statusAtual === 'Pendente' ? 'selected':''}>⏳ Analisando</option>
                        <option value="Concluido" ${statusAtual === 'Concluido' ? 'selected':''}>✓ Concluído</option>
                        <option value="NaoFeito" ${statusAtual === 'NaoFeito' ? 'selected':''}>❌ Recusado</option>
                    </select>
                    <button class="btn-deletar-pequeno" onclick="deletarTarefaLocal('${alunoId}', '${tarefa.id}')">X</button>
                </div>
            </div>`;
    });
    listaTarefasAdminContainer.innerHTML = htmlTarefas;
}

function mudarStatusTarefaLocal(alunoId, tarefaId, novoStatus) {
    const tarefa = tarefasAlunos[alunoId].find(t => t.id === tarefaId);
    if(tarefa) { 
        tarefa.status = novoStatus; 
        renderizarTarefasAdmin(alunoId); 
    }
}

function deletarTarefaLocal(alunoId, tarefaId) {
    if(confirm('Apagar essa tarefa da lista?')) {
        tarefasAlunos[alunoId] = tarefasAlunos[alunoId].filter(t => t.id !== tarefaId);
        renderizarTarefasAdmin(alunoId);
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

    btnAlternarPagamento.onclick = () => {
        mensalidadesAlunos[alunoId][mesChave] = !estaPago;
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

    if (container.dataset.estadoAtual === estadoAtualString) {
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
                cb.addEventListener('change', function() {
                    progressoAlunos[chaveSalva] = this.checked;
                    span.className = this.checked ? 'concluido' : '';
                    
                    const pct = calcularProgresso(alunoId, inst.topicos);
                    if(barra) barra.style.width = pct + '%'; 
                    if(texto) texto.innerText = pct + '%';
                    
                    container.dataset.estadoAtual = container.dataset.estadoAtual.replace(
                        `${chaveSalva}:${!this.checked}`, 
                        `${chaveSalva}:${this.checked}`
                    );
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
    if (btnSalvarGeral) {
        btnSalvarGeral.addEventListener('click', salvarNaNuvem);
    }

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
