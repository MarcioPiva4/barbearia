// script.js
document.addEventListener("DOMContentLoaded", () => {
  /* ================= Header Scroll ================= */
  const header = document.getElementById("header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        header.classList.add("backdrop-luxury", "border-b", "border-border/20");
      } else {
        header.classList.remove("backdrop-luxury", "border-b", "border-border/20");
      }
    });
  }

  /* ================= Mobile Menu ================= */
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("active");
      const icon = mobileMenuButton.querySelector("i");
      if (icon) {
        icon.setAttribute("data-lucide", mobileMenu.classList.contains("hidden") ? "menu" : "x");
        lucide.createIcons();
      }
    });
  }

  /* ================= Smooth Scroll ================= */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        if (mobileMenu) mobileMenu.classList.add("hidden");
      }
    });
  });

  /* ================= Modal Helpers ================= */
  window.showModal = id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  window.hideModal = id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  };

  /* ================= Agendamento ================= */
  const appointmentForm = document.getElementById("appointment-form");
  const serviceNameInput = document.getElementById("appointment-service-name");
  const timeSelect = document.getElementById("appointment_time");

  if (timeSelect) {
    for (let hour = 8; hour <= 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        timeSelect.appendChild(option);
      }
    }
  }

  window.showAppointmentModal = (serviceName = "Consulta") => {
    if (serviceNameInput) serviceNameInput.value = serviceName;
    showModal("appointment-modal");
  };

  if (appointmentForm) {
    appointmentForm.addEventListener("submit", e => {
      e.preventDefault();

      // 🔥 redireciona direto para dashboard
      window.location.href = "dashboard.html";
    });
  }

  /* ================= Produto - Modal de Compra ================= */
  const productOrderForm = document.getElementById("product-order-form");
  const orderSuccess = document.getElementById("order-success");
  const orderProductName = document.getElementById("order-product-name");
  const orderProductPrice = document.getElementById("order-product-price");
  const orderQuantity = document.getElementById("order-quantity");

  let selectedProduct = null;

  window.showProductOrderModal = function (nome, preco, id) {
    selectedProduct = { id, nome, preco };

    if (orderProductName) orderProductName.textContent = nome;
    if (orderProductPrice) orderProductPrice.textContent = `R$ ${Number(preco).toFixed(2)}`;
    if (orderQuantity) orderQuantity.value = 1;

    // 🔥 sempre começa no formulário
    productOrderForm.reset();
    productOrderForm.classList.remove("hidden");
    orderSuccess?.classList.add("hidden");

    showModal("product-order-modal");
  };

  if (productOrderForm) {
    productOrderForm.addEventListener("submit", async e => {
      e.preventDefault();

      // pega cookie simples
      function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
      }

      const clienteId = getCookie("userId");
      if (!clienteId) return (window.location = "/auth.html");

      const quantidade = Number(orderQuantity.value);

      const payload = {
        clienteId,
        itens: [
          {
            produtoId: selectedProduct.id,
            quantidade,
          }
        ]
      };

      try {
        const res = await fetch("https://lipes-cortes.vercel.app/api/vendas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao realizar compra");

        console.log("Venda registrada:", data);

        // esconde formulário e mostra sucesso
        productOrderForm.style.display = "none";
        orderSuccess?.classList.remove("hidden");

        document.getElementById("btn-dashboard").onclick = () => {
          window.location.href = "dashboard.html";
        };
        document.getElementById("btn-continue").onclick = () => {
          hideModal("product-order-modal");
          productOrderForm.reset();
          productOrderForm.classList.remove("hidden");
          orderSuccess?.classList.add("hidden");
        };
      } catch (err) {
        console.error(err);
        alert("Erro ao concluir a compra.");
      }
    });
  }

async function carregarProdutos() {
  const container = document.getElementById("productsGrid"); // id do grid no HTML
  if (!container) return;
  container.innerHTML = "";

  try {
    const res = await fetch("https://lipes-cortes.vercel.app/api/produtos");
    const produtos = await res.json();

    if (!Array.isArray(produtos) || produtos.length === 0) {
      container.innerHTML = "<p>Nenhum produto encontrado.</p>";
      return;
    }

    produtos.forEach((produto, index) => {
      const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];

      const uniqueId = `swiper-produto-${index}`;

      const card = document.createElement("div");
      card.classList.add("product-card");
      card.innerHTML = `
        <div class="p-4 shadow-md rounded-xl bg-white">
          <div class="swiper ${uniqueId}">
            <div class="swiper-wrapper">
              ${imagens.length > 0
                ? imagens.map(url => `
                  <div class="swiper-slide">
                    <img src="${url.url}" alt="${produto.nome}" class="w-full h-48 object-cover rounded-xl" />
                  </div>
                `).join("")
                : `
                  <div class="swiper-slide">
                    <img src="placeholder.jpg" alt="${produto.nome}" class="w-full h-48 object-cover rounded-xl" />
                  </div>
                `}
            </div>
            <div class="swiper-pagination"></div>
          </div>
          <h3 class="text-lg font-semibold mt-2">${produto.nome}</h3>
          <p class="text-gray-600">R$ ${Number(produto.preco).toFixed(2)}</p>
          <button class="mt-2 bg-black text-white px-3 py-1 rounded-lg"
            onclick="showProductOrderModal('${produto.nome}', '${produto.preco}', '${produto.id}')">
            Comprar
          </button>
        </div>
      `;

      container.appendChild(card);

      // inicializa o swiper desse produto
      new Swiper(`.${uniqueId}`, {
        slidesPerView: 1,
        spaceBetween: 10,
        pagination: {
          el: `.${uniqueId} .swiper-pagination`,
          clickable: true,
        },
      });
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Erro ao carregar produtos.</p>";
  }
}


  // carregarProdutos();
});


document.addEventListener("DOMContentLoaded", () => {
  new Swiper(".about-swiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
      el: ".about-swiper .swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".about-swiper .swiper-button-next",
      prevEl: ".about-swiper .swiper-button-prev",
    },
    loop: true
  });
});
