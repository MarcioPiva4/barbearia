const apiBase = "https://lipes-cortes.vercel.app/api/servicos";

// ================= Carrega e exibe os serviços =================
async function carregarServicos() {
  const container = document.getElementById("services-list");
  container.innerHTML = "Carregando...";

  try {
    const res = await fetch(apiBase);
    const servicos = await res.json();

    if (!Array.isArray(servicos) || servicos.length === 0) {
      container.innerHTML = "<p>Nenhum serviço cadastrado.</p>";
      return;
    }

    container.innerHTML = "";

    servicos.forEach((servico) => {
      const card = document.createElement("div");
      card.className = "servico-card";

      const imagensHTML = servico.imagens?.length
        ? servico.imagens
            .map(
              (img, index) => `
          <div class="imagem-item" data-index="${index}" style="display:inline-block; position:relative; margin-right:5px;">
            <img src="${img.url}" alt="${servico.nome}" width="50" height="50" />
            <button type="button" class="btn-remove-img" style="position:absolute; top:0; right:0; font-size:12px;">×</button>
          </div>
        `
            )
            .join("")
        : "Sem imagens";

      card.innerHTML = `
        <input type="text" class="input-edit nome" value="${servico.nome}" />
        <input type="text" class="input-edit descricao" value="${servico.descricao}" />
        <input type="number" class="input-edit preco" value="${servico.preco}" />
        <input type="number" class="input-edit duracao" value="${servico.duracao || 0}" placeholder="Duração (min)" />
        <input type="file" class="input-edit imagens-file" multiple accept="image/*" />

        <div class="actions">
          <button onclick="atualizarServico('${servico.id}', this)">Salvar</button>
          <button onclick="excluirServico('${servico.id}')">Excluir</button>
        </div>

        <div class="preview-imagens">${imagensHTML}</div>
      `;

      container.appendChild(card);

      // Adiciona evento para remover imagens
      const btnsRemove = card.querySelectorAll(".btn-remove-img");
      btnsRemove.forEach((btn) => {
        btn.addEventListener("click", () => {
          const imagemItem = btn.closest(".imagem-item");
          imagemItem.remove();
        });
      });
    });
  } catch (error) {
    console.error("Erro ao carregar serviços:", error);
    container.innerHTML = "<p>Erro ao carregar serviços.</p>";
  }
}

// ================= Adiciona novo serviço =================
async function adicionarServico() {
  const nome = document.getElementById("novo-servico-nome").value.trim();
  const descricao = document.getElementById("novo-servico-desc").value.trim();
  const preco = parseFloat(document.getElementById("novo-servico-preco").value);
  const duracao = parseInt(document.getElementById("novo-servico-duracao").value);
  const fileInput = document.getElementById("novo-servico-files");

  if (!nome || !descricao || isNaN(preco) || isNaN(duracao)) {
    return alert("Preencha todos os campos corretamente.");
  }

  let imagens = [];

  if (fileInput.files.length > 0) {
    imagens = await converterArquivosParaBase64(fileInput.files);
  }

  try {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao, preco, duracao, imagens }),
    });

    if (!res.ok) {
      const data = await res.json();
      return alert(data.message || "Erro ao adicionar serviço.");
    }

    alert("Serviço adicionado com sucesso!");
    resetFormServico();
    carregarServicos();
  } catch (err) {
    console.error("Erro ao adicionar serviço:", err);
    alert("Erro ao adicionar serviço.");
  }
}

// ================= Atualiza um serviço =================
async function atualizarServico(id, btn) {
  const card = btn.closest(".servico-card");
  const nome = card.querySelector(".nome").value.trim();
  const descricao = card.querySelector(".descricao").value.trim();
  const preco = parseFloat(card.querySelector(".preco").value);
  const duracao = parseInt(card.querySelector(".duracao").value);
  const fileInput = card.querySelector(".imagens-file");

  if (!nome || !descricao || isNaN(preco) || isNaN(duracao)) {
    return alert("Preencha todos os campos corretamente.");
  }

  // Pega URLs das imagens existentes que não foram removidas
  const imagensExistentes = Array.from(card.querySelectorAll(".preview-imagens img"))
    .map(img => img.src);

  // Converte novas imagens selecionadas em base64
  let imagensNovas = [];
  if (fileInput.files.length > 0) {
    imagensNovas = await converterArquivosParaBase64(fileInput.files);
  }

  // Envia as imagens: tanto as URLs antigas quanto as novas base64
  const imagens = [...imagensExistentes, ...imagensNovas];

  try {
    const res = await fetch(`${apiBase}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao, preco, duracao, imagens }),
    });

    if (!res.ok) {
      const data = await res.json();
      return alert(data.message || "Erro ao atualizar serviço.");
    }

    alert("Serviço atualizado com sucesso!");
    carregarServicos();
  } catch (err) {
    console.error("Erro ao atualizar serviço:", err);
    alert("Erro ao atualizar serviço.");
  }
}

// ================= Exclui um serviço =================
async function excluirServico(id) {
  if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

  try {
    const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      return alert(data.message || "Erro ao excluir serviço.");
    }

    alert("Serviço excluído com sucesso!");
    carregarServicos();
  } catch (err) {
    console.error("Erro ao excluir serviço:", err);
    alert("Erro ao excluir serviço.");
  }
}

// ================= Utilitário: Converter arquivos para base64 =================
async function converterArquivosParaBase64(fileList) {
  const arquivos = Array.from(fileList);
  const base64Array = await Promise.all(
    arquivos.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        })
    )
  );
  return base64Array;
}

// ================= Reset form =================
function resetFormServico() {
  document.getElementById("novo-servico-nome").value = "";
  document.getElementById("novo-servico-desc").value = "";
  document.getElementById("novo-servico-preco").value = "";
  document.getElementById("novo-servico-duracao").value = "";
  document.getElementById("novo-servico-files").value = "";
}

// ================= Eventos =================
document.querySelector(".btn.orange").addEventListener("click", adicionarServico);
document.addEventListener("DOMContentLoaded", carregarServicos);
