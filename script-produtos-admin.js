const PRODUTOS_API = "https://lipes-cortes.vercel.app/api/produtos";

// ================== CARREGAR PRODUTOS ==================
async function carregarProdutos() {
  const tbody = document.getElementById("produtos-table-body");
  tbody.innerHTML = "<tr><td colspan='6'>Carregando...</td></tr>";

  try {
    const res = await fetch(PRODUTOS_API);
    const produtos = await res.json();

    if (!Array.isArray(produtos) || produtos.length === 0) {
      tbody.innerHTML = "<tr><td colspan='6'>Nenhum produto cadastrado.</td></tr>";
      return;
    }

    tbody.innerHTML = "";
    produtos
      .filter((p) => !p.deletado)
      .forEach((prod) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td class="nome">${prod.nome}</td>
          <td class="descricao">${prod.descricao}</td>
          <td class="preco">R$ ${prod.preco.toFixed(2)}</td>
          <td class="estoque">${prod.estoque}</td>
          <td class="imagens">
            ${
              prod.imagens && prod.imagens.length > 0
                ? prod.imagens
                    .map(
                      (img) =>
                        `<img src="${img.url || img}" alt="${prod.nome}" width="50" style="margin-right:5px;" />`
                    )
                    .join("")
                : "Sem imagens"
            }
          </td>
          <td class="acoes">
            <button class="btn-icon blue" onclick="editarProdutoInline(this, ${prod.id})">
              <i data-lucide="pencil"></i>
            </button>
            <button class="btn-icon red" onclick="excluirProduto(${prod.id})">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        `;

        tbody.appendChild(tr);
      });

    lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan='6' style="color:red">Erro: ${err.message}</td></tr>`;
  }
}

// ================== EDITAR INLINE ==================
function editarProdutoInline(btn, id) {
  const tr = btn.closest("tr");

  const nome = tr.querySelector(".nome").textContent;
  const descricao = tr.querySelector(".descricao").textContent;
  const preco = tr.querySelector(".preco").textContent.replace("R$ ", "");
  const estoque = tr.querySelector(".estoque").textContent;
  const imagensTd = tr.querySelector(".imagens");
  const imagens = Array.from(imagensTd.querySelectorAll("img")).map(img => img.src);

  tr.querySelector(".nome").innerHTML = `<input type="text" value="${nome}" />`;
  tr.querySelector(".descricao").innerHTML = `<input type="text" value="${descricao}" />`;
  tr.querySelector(".preco").innerHTML = `<input type="number" step="0.01" value="${preco}" />`;
  tr.querySelector(".estoque").innerHTML = `<input type="number" value="${estoque}" />`;
  tr.querySelector(".imagens").innerHTML = `
    <input type="file" multiple accept="image/*" />
    <div class="preview-images" style="display:flex; gap:5px; flex-wrap: wrap;">
      ${imagens.map((url, index) => `
        <div class="image-wrapper" style="position: relative; display: inline-block;">
          <img src="${url}" width="50" style="display: block; border-radius: 4px;" />
          <button type="button" class="btn-remove-image" data-index="${index}" 
            style="
              position: absolute;
              top: -6px;
              right: -6px;
              background: red;
              color: white;
              border: none;
              border-radius: 50%;
              width: 18px;
              height: 18px;
              font-weight: bold;
              cursor: pointer;
              line-height: 16px;
              padding: 0;
            ">×</button>
        </div>
      `).join('')}
    </div>
  `;

  tr.querySelector(".acoes").innerHTML = `
    <button class="btn-icon green" onclick="salvarProdutoInline(this, ${id})">
      <i data-lucide="check"></i>
    </button>
    <button class="btn-icon gray" onclick="cancelarEdicaoInline(${id})">
      <i data-lucide="x"></i>
    </button>
  `;

  lucide.createIcons();

  // Adiciona evento para remover imagens
  const previewDiv = tr.querySelector(".preview-images");
  previewDiv.querySelectorAll(".btn-remove-image").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      button.parentElement.remove();
    });
  });
}

// ================== SALVAR EDIÇÃO INLINE ==================
async function salvarProdutoInline(btn, id) {
  const tr = btn.closest("tr");

  const nome = tr.querySelector("td:nth-child(1) input").value.trim();
  const descricao = tr.querySelector("td:nth-child(2) input").value.trim();
  const preco = parseFloat(tr.querySelector("td:nth-child(3) input").value);
  const estoque = parseInt(tr.querySelector("td:nth-child(4) input").value);

  if (!nome || !descricao || isNaN(preco) || isNaN(estoque)) {
    return alert("Preencha todos os campos corretamente.");
  }

  // Pega os arquivos novos
  const fileInput = tr.querySelector("td:nth-child(5) input[type=file]");
  const files = fileInput.files;
  const imagensNovas = [];

  for (const file of files) {
    const base64 = await fileToBase64(file);
    imagensNovas.push(base64);
  }

  // Mantém imagens antigas que ainda estão no preview
  const oldImages = Array.from(tr.querySelectorAll(".preview-images img")).map(img => img.src);
  const todasImagens = [...oldImages, ...imagensNovas];

  try {
    const res = await fetch(`${PRODUTOS_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao, preco, estoque, imagens: todasImagens }),
    });

    if (!res.ok) {
      const erro = await res.json();
      return alert("Erro: " + (erro.error || "Não foi possível atualizar o produto."));
    }

    carregarProdutos();
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    alert("Erro ao atualizar produto.");
  }
}

// ================== CANCELAR EDIÇÃO INLINE ==================
function cancelarEdicaoInline(id) {
  carregarProdutos();
}

// ================== EXCLUIR PRODUTO ==================
async function excluirProduto(id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;

  try {
    const res = await fetch(`${PRODUTOS_API}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const erro = await res.json();
      return alert("Erro: " + (erro.error || "Não foi possível excluir o produto."));
    }

    carregarProdutos();
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    alert("Erro ao excluir produto.");
  }
}

// ================== CONVERTER ARQUIVO PARA BASE64 ==================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // base64
    reader.onerror = reject;
    reader.readAsDataURL(file); // converte para base64
  });
}

// ================== ADICIONAR NOVO PRODUTO ==================
document.getElementById("btn-adicionar-produto").addEventListener("click", async () => {
  const nome = document.getElementById("novo-produto-nome").value.trim();
  const descricao = document.getElementById("novo-produto-desc").value.trim();
  const preco = parseFloat(document.getElementById("novo-produto-preco").value);
  const estoque = parseInt(document.getElementById("novo-produto-estoque").value);
  const imagensInput = document.getElementById("novo-produto-imagens");

  if (!nome || !descricao || isNaN(preco) || isNaN(estoque)) {
    return alert("Preencha todos os campos corretamente.");
  }

  const files = imagensInput.files;
  const imagens = [];

  for (const file of files) {
    const base64 = await fileToBase64(file);
    imagens.push(base64);
  }

  try {
    const res = await fetch(PRODUTOS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao, preco, estoque, imagens }),
    });

    if (!res.ok) {
      const erro = await res.json();
      return alert("Erro: " + (erro.error || "Não foi possível adicionar o produto."));
    }

    // Limpar campos
    document.getElementById("novo-produto-nome").value = "";
    document.getElementById("novo-produto-desc").value = "";
    document.getElementById("novo-produto-preco").value = "";
    document.getElementById("novo-produto-estoque").value = "";
    document.getElementById("novo-produto-imagens").value = "";

    alert("Produto adicionado com sucesso!");
    carregarProdutos();
  } catch (err) {
    console.error("Erro ao adicionar produto:", err);
    alert("Erro ao adicionar produto.");
  }
});

// ================== EVENTOS ==================
document.addEventListener("DOMContentLoaded", carregarProdutos);
