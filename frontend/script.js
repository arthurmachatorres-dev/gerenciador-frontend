// URL do backend online
const API = 'https://gerenciador-backend.onrender.com'; // substitua pelo link real do seu backend no Render

// função para formatar data que vem como "YYYY-MM-DD" para "DD/MM/YYYY"
function formatarDataBR(isoDate) {
  if (!isoDate) return '';
  const [ano, mes, dia] = isoDate.split('-');
  if (!ano || !mes || !dia) return isoDate;
  return `${dia}/${mes}/${ano}`;
}

// populate months select
const mesSelect = document.getElementById('mes');
for (let i = 1; i <= 12; i++) {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = new Date(0, i - 1).toLocaleString('pt-BR', { month: 'long' });
  mesSelect.appendChild(opt);
}
const agora = new Date();
mesSelect.value = agora.getMonth() + 1;
document.getElementById('ano').value = agora.getFullYear();

// elementos
const btnSalvarSalario = document.getElementById('btnSalvarSalario');
const btnSalvarConta = document.getElementById('btnSalvarConta');

// elementos do modal
const modalOverlay = document.getElementById('modalOverlay');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');

const editNomeConta = document.getElementById('editNomeConta');
const editTipoConta = document.getElementById('editTipoConta');
const editValorConta = document.getElementById('editValorConta');
const editVencimentoConta = document.getElementById('editVencimentoConta');

let contaEmEdicao = null;

// helpers modal
function abrirModal() {
  modalOverlay.classList.remove('hidden');
}

function fecharModal() {
  modalOverlay.classList.add('hidden');
  contaEmEdicao = null;
  editNomeConta.value = '';
  editTipoConta.value = '';
  editValorConta.value = '';
  editVencimentoConta.value = '';
}

// salário
async function carregarSalario() {
  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;
  const res = await fetch(`${API}/salario/${mes}/${ano}`);
  const data = await res.json();
  document.getElementById('salario').value = data.salario || 0;
}

btnSalvarSalario.addEventListener('click', async () => {
  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;
  const salario = Number(document.getElementById('salario').value || 0);
  await fetch(`${API}/salario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mes, ano, salario })
  });
  carregarResumo();
});

// ---------- CRIAR CONTA ----------
async function salvarConta() {
  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;
  const nome = document.getElementById('nomeConta').value.trim();
  const tipo = document.getElementById('tipoConta').value.trim();
  const valor = Number(document.getElementById('valorConta').value || 0);
  const data_vencimento = document.getElementById('vencimentoConta').value || null;

  if (!nome || !valor) {
    alert('Preencha pelo menos o nome e o valor da conta.');
    return;
  }

  const payload = {
    nome,
    tipo,
    tipo_conta: tipo,
    valor,
    data_vencimento,
    vencimento: data_vencimento,
    mes,
    ano
  };

  await fetch(`${API}/contas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  document.getElementById('nomeConta').value = '';
  document.getElementById('tipoConta').value = '';
  document.getElementById('valorConta').value = '';
  document.getElementById('vencimentoConta').value = '';

  listarContas();
  carregarResumo();
}

btnSalvarConta.addEventListener('click', salvarConta);

// ---------- LISTAR CONTAS ----------
async function listarContas() {
  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;
  const res = await fetch(`${API}/contas/${mes}/${ano}`);
  const contas = await res.json();
  const lista = document.getElementById('listaContas');
  lista.innerHTML = '';

  contas.forEach(c => {
    const tipo = c.tipo ?? c.tipo_conta ?? '';
    const vencRaw = c.data_vencimento ?? c.vencimento ?? '';
    const vencimento = vencRaw ? formatarDataBR(vencRaw) : '';

    const li = document.createElement('li');
    if (c.status === 'PAGO') li.classList.add('pago');

    li.innerHTML = `
      <div class="info">
        <strong>${c.nome}</strong>
        <div class="meta">
          ${tipo || 'Sem tipo'} • ${vencimento || 'Sem vencimento'}
        </div>
      </div>
      <div class="value-actions">
        <div class="value">R$ ${Number(c.valor).toFixed(2)}</div>
        <div class="actions">
          <button onclick="editarConta(${c.id})">✏️ Editar</button>
          <button onclick="pagarConta(${c.id})">
            ${c.status === 'PAGO' ? '✅ Desmarcar' : '💸 Pago'}
          </button>
          <button onclick="excluirConta(${c.id})">🗑 Excluir</button>
        </div>
      </div>
    `;
    lista.appendChild(li);
  });
}

// ---------- EDITAR (abrir modal) ----------
window.editarConta = async function (id) {
  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;
  const res = await fetch(`${API}/contas/${mes}/${ano}`);
  const contas = await res.json();
  const c = contas.find(x => x.id === id);
  if (!c) return;

  contaEmEdicao = id;
  const tipo = c.tipo ?? c.tipo_conta ?? '';
  const vencimento = c.data_vencimento ?? c.vencimento ?? '';

  editNomeConta.value = c.nome;
  editTipoConta.value = tipo;
  editValorConta.value = c.valor;
  editVencimentoConta.value = vencimento || '';

  abrirModal();
};

// ---------- EDITAR (salvar modal) ----------
async function salvarEdicaoModal() {
  if (!contaEmEdicao) {
    fecharModal();
    return;
  }

  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;

  const nome = editNomeConta.value.trim();
  const tipo = editTipoConta.value.trim();
  const valor = Number(editValorConta.value || 0);
  const data_vencimento = editVencimentoConta.value || null;

  if (!nome || !valor) {
    alert('Preencha pelo menos o nome e o valor da conta.');
    return;
  }

  const payload = {
    nome,
    tipo,
    tipo_conta: tipo,
    valor,
    data_vencimento,
    vencimento: data_vencimento,
    mes,
    ano
  };

  await fetch(`${API}/contas/${contaEmEdicao}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  fecharModal();
  listarContas();
  carregarResumo();
}

// ---------- PAGAR / DESMARCAR ----------
window.pagarConta = async function (id) {
  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;
  const res = await fetch(`${API}/contas/${mes}/${ano}`);
  const contas = await res.json();
  const c = contas.find(x => x.id === id);
  if (!c) return;
  const novoStatus = c.status === 'PAGO' ? 'PENDENTE' : 'PAGO';
  await fetch(`${API}/contas/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: novoStatus })
  });
  listarContas();
  carregarResumo();
};

// ---------- EXCLUIR ----------
window.excluirConta = async function (id) {
  if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
  await fetch(`${API}/contas/${id}`, {
    method: 'DELETE'
  });
  listarContas();
  carregarResumo();
};

// ---------- RESUMO ----------
async function carregarResumo() {
  const mes = document.getElementById('mes').value;
  const ano = document.getElementById('ano').value;
  const res = await fetch(`${API}/resumo/${mes}/${ano}`);
  const dados = await res.json();
  document.getElementById('totalContas').innerText = Number(dados.total_contas || 0).toFixed(2);
  document.getElementById('contasPagas').innerText = Number(dados.pagos || 0).toFixed(2);
  document.getElementById('contasPendentes').innerText = Number(dados.pendentes || 0).toFixed(2);
  document.getElementById('saldoFinal').innerText = Number(dados.saldo_final || 0).toFixed(2);
}

// eventos do modal
btnFecharModal.addEventListener('click', fecharModal);
btnCancelarEdicao.addEventListener('click', fecharModal);
btnSalvarEdicao.addEventListener('click', salvarEdicaoModal);

// fechar modal ao clicar fora
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    fecharModal();
  }
});

// troca de mês/ano
mesSelect.addEventListener('change', () => { listarContas(); carregarResumo(); });
document.getElementById('ano').addEventListener('change', () => { listarContas(); carregarResumo(); });

// init
carregarSalario();
listarContas();
carregarResumo();