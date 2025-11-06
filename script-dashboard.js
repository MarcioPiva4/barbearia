  const API_URL = "https://lipes-cortes.vercel.app/api/agendamentos";

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  function logout() {
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    alert("Você saiu da sua conta.");
    window.location.href = "auth.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const userId = getCookie("userId");
    if (!userId) {
      alert("Usuário não autenticado. Faça login novamente.");
      window.location.href = "auth.html";
      return;
    }

    carregarAgendamentos(userId);
    carregarServicos();
    carregarCompras();

    const form = document.getElementById("schedule-form");
    form.addEventListener("submit", (e) => criarAgendamento(e, userId));
  });
  
  function mostrarMensagem(texto, erro = false) {
    const msg = document.getElementById("mensagem");
    msg.innerHTML = texto;
    msg.className = erro ? "mensagem erro" : "mensagem";
    msg.style.display = "block";

    setTimeout(() => {
      msg.style.display = "none";
    }, 5000);
  }
  async function carregarAgendamentos(userId) {
    try {
      const res = await fetch(API_URL);
      let agendamentos = await res.json();
      agendamentos = agendamentos.filter(ag => ag.userId === userId);

      const tbody = document.querySelector("#appointments-table tbody");
      tbody.innerHTML = "";

      let cancelados = [];

      agendamentos.forEach(ag => {
        const row = document.createElement("tr");

        const servicos = ag.servicos?.map(s => s.servico?.nome || "Serviço").join(", ") || "—";
        const dataFormatada = new Date(ag.dataAgendamento).toLocaleString("pt-BR");

        row.innerHTML = `
          <td>${servicos}</td>
          <td>${dataFormatada}</td>
          <td>${ag.status}</td>
          <td>
            <button class="action-btn edit-btn" onclick="remarcarAgendamento('${ag.id}')">Editar</button>
            <button class="action-btn delete-btn" onclick="cancelarAgendamento('${ag.id}')">Cancelar</button>
          </td>
        `;
        tbody.appendChild(row);

        // Se estiver cancelado, guarda no array
        if (ag.status?.toUpperCase() === "CANCELADO") {
          cancelados.push({ servicos, data: dataFormatada });
        }
      });

      // Se houver cancelados, exibe mensagem
      if (cancelados.length > 0) {
        let mensagemTexto = "⚠️ Os seguintes agendamentos foram cancelados:<br>";
        cancelados.forEach(c => {
          mensagemTexto += `• ${c.servicos} — ${c.data}<br>`;
        });
        mostrarMensagem(mensagemTexto, true);
      }
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
      mostrarMensagem("Erro ao carregar agendamentos.", true);
    }
  }
  

  async function carregarServicos() {
    try {
      const res = await fetch("https://lipes-cortes.vercel.app/api/servicos");
      const servicos = await res.json();
      const container = document.getElementById("service-checkboxes");
      container.innerHTML = "";

      servicos.forEach(s => {
        const label = document.createElement("label");
        label.className = "checkbox-container";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = "service-checkbox";
        input.value = s.id;

        const custom = document.createElement("span");
        custom.className = "custom-checkbox";

        label.appendChild(input);
        label.appendChild(custom);
        label.append(` ${s.nome} - R$${s.preco.toFixed(2)}`);

        container.appendChild(label);
      });
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    }
  }

  async function criarAgendamento(e, userId) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="service-checkbox"]:checked');
    const servicoIds = Array.from(checkboxes).map(cb => cb.value);
    const data = document.getElementById("appointment-date").value;

    if (!servicoIds.length) {
      alert("Selecione pelo menos um serviço.");
      return;
    }

    const novoAgendamento = { userId, dataAgendamento: data, servicoIds };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoAgendamento),
      });

      if (!res.ok) {
        const erro = await res.json();
        alert("Erro: " + erro.error);
        return;
      }

      alert("Agendamento criado com sucesso!");
      document.getElementById("schedule-form").reset();
      carregarAgendamentos(userId);
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
    }
  }

let agendamentoEditandoId = null;

async function remarcarAgendamento(id) {
  agendamentoEditandoId = id;
  document.getElementById("edit-date").value = "";

  // Carrega os serviços disponíveis
  try {
    const res = await fetch("https://lipes-cortes.vercel.app/api/servicos");
    const servicos = await res.json();

    const container = document.getElementById("edit-service-checkboxes");
    container.innerHTML = "";

    servicos.forEach(s => {
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" value="${s.id}" />
        <strong>${s.nome}</strong> - R$${s.preco.toFixed(2)} (${s.duracao || 30} min) <br>
      `;
      container.appendChild(label);
    });

    abrirModal();
  } catch (err) {
    console.error("Erro ao carregar serviços:", err);
    alert("Erro ao carregar serviços.");
  }
}

function abrirModal() {
  document.getElementById("edit-modal").style.display = "block";
}

function fecharModal() {
  document.getElementById("edit-modal").style.display = "none";
  agendamentoEditandoId = null;
}

async function salvarEdicao() {
  const novaData = document.getElementById("edit-date").value;

  const checkboxes = document.querySelectorAll("#edit-service-checkboxes input[type='checkbox']:checked");
  const servicoIds = Array.from(checkboxes).map(cb => cb.value);

  if (!novaData && servicoIds.length === 0) {
    alert("Selecione uma nova data ou serviços para editar.");
    return;
  }

  const body = {};
  if (novaData) body.novaData = novaData;
  if (servicoIds.length > 0) body.servicoIds = servicoIds;

  try {
    const res = await fetch(`${API_URL}/${agendamentoEditandoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const resultado = await res.json();

    if (!res.ok) {
      alert("Erro: " + resultado.error);
      return;
    }

    alert("Agendamento atualizado com sucesso!");
    fecharModal();
    carregarAgendamentos(getCookie("userId"));
  } catch (err) {
    console.error("Erro ao editar agendamento:", err);
    alert("Erro ao editar agendamento.");
  }
}



async function cancelarAgendamento(id) {
  if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

  try {
    // 🔹 Primeiro busca o agendamento antes de cancelar
    const resAg = await fetch(`${API_URL}/${id}`);
    const agendamento = await resAg.json();

    const servicosNomes = agendamento.servicos
      ? agendamento.servicos.map(s => s.servico?.nome || "Serviço").join(", ")
      : "Serviços não encontrados";

    const dataAgendamento = agendamento.dataAgendamento
      ? new Date(agendamento.dataAgendamento).toLocaleString("pt-BR")
      : "Data desconhecida";

    // 🔹 Agora faz o cancelamento
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELADO" }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao cancelar agendamento.");
      return;
    }

    // 🔹 Mensagem personalizada
    alert(`O agendamento de ${servicosNomes} (${dataAgendamento}) foi cancelado com sucesso!`);

    carregarAgendamentos(getCookie("userId"));
  } catch (err) {
    console.error("Erro ao cancelar agendamento:", err);
    alert("Erro ao cancelar agendamento.");
  }
}

    async function carregarCompras() {
      const tabela = document.querySelector("#purchases-table tbody");
      tabela.innerHTML = "<tr><td colspan='4'>Carregando...</td></tr>";

      const clienteId = getCookie("userId");
      if (!clienteId) return (window.location = "/auth.html");

      try {
        const res = await fetch("https://lipes-cortes.vercel.app/api/vendas", { method: "GET" });
        const vendas = await res.json();

        tabela.innerHTML = "";

        // filtra apenas as vendas do usuário logado
        const vendasUsuario = vendas.filter(venda => venda.clienteId === clienteId);

        if (vendasUsuario.length === 0) {
          tabela.innerHTML = "<tr><td colspan='4'>Nenhuma compra encontrada</td></tr>";
          return;
        }

        vendasUsuario.forEach(venda => {
          const tr = document.createElement("tr");

          const produtos = venda.itens
            .map(i => `${i.produto.nome} (x${i.quantidade})`)
            .join(", ");

          tr.innerHTML = `
        <td>${produtos}</td>
        <td>R$ ${venda.total.toFixed(2)}</td>
        <td>${new Date(venda.dataVenda).toLocaleString("pt-BR")}</td>
        <td>
          <button class="btn red" onclick="cancelarCompra(${venda.id})">Cancelar</button>
        </td>
      `;

          tabela.appendChild(tr);
        });
      } catch (err) {
        console.error("Erro ao carregar compras:", err);
        tabela.innerHTML = "<tr><td colspan='4'>Erro ao carregar</td></tr>";
      }
    }
    async function cancelarCompra(id) {
      if (!confirm("Tem certeza que deseja cancelar esta compra?")) return;

      try {
        const res = await fetch(`https://lipes-cortes.vercel.app/api/vendas/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (res.ok) {
          alert("Compra cancelada com sucesso");
          carregarCompras();
        } else {
          alert(data.error || "Erro ao cancelar compra");
        }
      } catch (err) {
        console.error("Erro ao cancelar compra:", err);
        alert("Erro ao cancelar compra");
      }
    }
