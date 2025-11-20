function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

async function carregarCompras() {
  const clienteId = getCookie("userId");

  // Se NÃO estiver logado
  if (!clienteId) {
    // Limpando toda a página (somente o conteúdo da área de compras)
    const container = document.querySelector("#purchases-table").parentElement;
    container.innerHTML = "";

    // Criando wrapper estilizado
    const box = document.createElement("div");
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.alignItems = "center";
    box.style.justifyContent = "center";
    box.style.padding = "40px";
    box.style.marginTop = "40px";
    box.style.borderRadius = "12px";
    box.style.background = "#1c1c1c";
    box.style.boxShadow = "0 0 20px rgba(0,0,0,0.3)";
    box.style.textAlign = "center";
    box.style.color = "#fff";

    // Mensagem
    const msg = document.createElement("h2");
    msg.innerText = "Você precisa estar logado para visualizar suas compras";
    msg.style.marginBottom = "20px";
    msg.style.color = "#EEBD2B";
    msg.style.fontSize = "1.4rem";

    // Botão moderno
    const btn = document.createElement("button");
    btn.innerText = "Fazer Login";
    btn.style.padding = "12px 24px";
    btn.style.fontSize = "1rem";
    btn.style.fontWeight = "bold";
    btn.style.background = "#EEBD2B";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.style.color = "#000";
    btn.style.transition = "0.2s";
    btn.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";

    btn.onmouseover = () => (btn.style.transform = "scale(1.05)");
    btn.onmouseout = () => (btn.style.transform = "scale(1)");

    // Redirecionamento
    btn.onclick = () => {
      window.location.href = "/auth.html"; // ALTERE para a URL correta
    };

    box.appendChild(msg);
    box.appendChild(btn);
    container.appendChild(box);

    return;
  }

  // --- A PARTIR DAQUI SEGUE A LÓGICA NORMAL ---
  const tabela = document.querySelector("#purchases-table tbody");
  tabela.innerHTML = "<tr><td colspan='4'>Carregando...</td></tr>";

  try {
    const res = await fetch("https://lipes-cortes.vercel.app/api/vendas", {
      method: "GET"
    });
    const vendas = await res.json();

    tabela.innerHTML = "";

    const vendasUsuario = vendas.filter(venda => venda.clienteId === clienteId);

    if (vendasUsuario.length === 0) {
      tabela.innerHTML = "<tr><td colspan='4'>Nenhuma compra encontrada</td></tr>";
      return;
    }

    vendasUsuario.forEach(venda => {
      const tr = document.createElement("tr");
      console.log(venda)
      const produtos = venda.itens
        .map(i => `${i.produto.nome} (x${i.quantidade})`)
        .join(", ");

      tr.innerHTML = `
        <td>${produtos}</td>
        <td>${venda.itens[0].quantidade}</td>
        <td>R$ ${venda.total.toFixed(2)}</td>
        <td>${new Date(venda.dataVenda).toLocaleString("pt-BR")}</td>
        <td>
          <button class="btn delete-btn action-btn" onclick="cancelarCompra(${venda.id})">Cancelar</button>
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
      method: "DELETE"
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

carregarCompras();
