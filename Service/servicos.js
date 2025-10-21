import API_URL from "../API_URL.js";

document.addEventListener("DOMContentLoaded", () => {
  carregarServicos();
  carregarProdutos();  
});

async function carregarProdutos() {
  try {
    const response = await fetch(`${API_URL}/produtos`);
    if (!response.ok) throw new Error("Erro ao buscar produtos");

    const produtos = await response.json();
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";

    produtos.forEach((produto, index) => {
      const avaliacao = produto.avaliacao ?? 5;
      const preco = produto.preco ?? 0;
      const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];

      const uniqueId = `swiper-produto-imagem-${index}`;

      const slide = document.createElement("div");
      slide.className = "swiper-slide"; // produto = 1 slide

      slide.innerHTML = `
        <div class="product-card animate-fade-in" style="animation-delay:${index * 100}ms">
          <div class="product-image-wrapper">
            <div class="swiper ${uniqueId}">
              <div class="swiper-wrapper">
                ${
                  imagens.length > 0
                    ? imagens.map(img => `
                        <div class="swiper-slide">
                          <img src="${img.url || img}" alt="${produto.nome}" class="product-image" />
                        </div>
                      `).join("")
                    : `
                      <div class="swiper-slide">
                        <img src="https://placehold.co/600x400?text=Lipe+Cortes" alt="${produto.nome}" class="product-image" />
                      </div>
                    `
                }
              </div>
            </div>
            ${produto.destaque ? `<span class="badge badge-featured">Destaque</span>` : ""}
          </div>

          <div class="product-content">
            <div class="product-rating">
              ${renderStars(avaliacao)}
              <span class="rating-text">(${avaliacao.toFixed(1)})</span>
            </div>
            <h3 class="product-title">${produto.nome}</h3>
            <p class="product-description">${produto.descricao}</p>
            <div class="product-pricing">
              <span class="product-price">${Number(produto.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            <button class="btn-hero btn-full-width" onclick="showProductOrderModal('${produto.nome}', ${preco}, ${produto.id})">
              <i data-lucide="shopping-cart" class="btn-icon"></i>
              Comprar Agora
            </button>
          </div>
        </div>
      `;

      grid.appendChild(slide);

      // inicializa Swiper interno (imagens)
      new Swiper(`.${uniqueId}`, {
        slidesPerView: 1,
      });
    });

    // inicializa Swiper externo (produtos)
    new Swiper(".produtos-swiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".produtos-swiper > .swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 4 }
      }
    });

    lucide.createIcons();
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}


function renderStars(nota = 5) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += `<i data-lucide="star" class="star-icon ${i <= nota ? "star-filled" : "star-empty"}"></i>`;
  }
  return stars;
}

async function carregarServicos() {
  const servicesGrid = document.querySelector("#servicesGrid");

  try {
    const response = await fetch(`${API_URL}/servicos`);
    if (!response.ok) throw new Error("Erro na API");

    const servicos = await response.json();
    servicesGrid.innerHTML = "";

    servicos.forEach((servico, index) => {
      const imagens = Array.isArray(servico.imagens) ? servico.imagens : [servico.imagem];
      const uniqueId = `swiper-servico-imagem-${index}`;

      const slide = document.createElement("div");
      slide.className = "swiper-slide"; // 1 serviço = 1 slide

      slide.innerHTML = `
        <div class="service-card animate-fade-in" style="animation-delay:${index * 150}ms">
          <div class="service-image-wrapper">
            <!-- swiper interno só para imagens -->
            <div class="swiper ${uniqueId}">
              <div class="swiper-wrapper">
                ${
                  imagens && imagens.length > 0
                    ? imagens.map(img => `
                        <div class="swiper-slide">
                          <img src="${img.url || 'https://placehold.co/600x400?text=Lipe+Cortes'}" alt="${servico.nome}" class="service-image" />
                        </div>
                      `).join("")
                    : `
                      <div class="swiper-slide">
                        <img src="https://placehold.co/600x400?text=Lipe+Cortes" alt="${servico.nome}" class="service-image" />
                      </div>
                    `
                }
              </div>
              <div class="swiper-pagination"></div>
            </div>
          </div>
          <div class="service-content">
            <div class="service-details">
              <h3 class="service-title">${servico.nome}</h3>
              <div class="service-pricing">
                <p class="service-price">
                  ${Number(servico.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p class="service-duration">
                  <i data-lucide="clock" class="service-icon"></i>${servico.duracao}m
                </p>
              </div>
            </div>
            <p class="service-description">${servico.descricao}</p>
            <a href="dashboard.html"><button class="btn-hero btn-full-width" onclick="showAppointmentModal('${servico.nome}')">
              <i data-lucide="calendar" class="btn-icon"></i>
              Agendar Agora
            </button></a>
          </div>
        </div>
      `;

      atualizarServicosFooter(servicos);
      
      servicesGrid.appendChild(slide);

      // inicializa Swiper interno (imagens de cada serviço)
      new Swiper(`.${uniqueId}`, {
        slidesPerView: 1,
        pagination: {
          el: `.${uniqueId} .swiper-pagination`,
          clickable: true,
        },
      });
    });

    // inicializa Swiper externo (todos os serviços)
    new Swiper(".servicos-swiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      navigation: {
        nextEl: ".servicos-swiper .swiper-button-next",
        prevEl: ".servicos-swiper .swiper-button-prev",
      },
      breakpoints: {
        0: {slidesPerView: 1},
        779: { slidesPerView: 2 },
        1024: { slidesPerView: 4 }
      }
    });

    lucide.createIcons();
  } catch (err) {
    console.error("Erro ao carregar serviços:", err);
  }
}

function atualizarServicosFooter(servicos) {
  const footerList = document.getElementById("footer-service-list");
  if (!footerList || !Array.isArray(servicos)) return;

  const topServicos = servicos.slice(0, 3); // ou quantos quiser mostrar
  footerList.innerHTML = topServicos.map(servico => `
    <li class="service-list-item">
      <span>${servico.nome}</span>
      <span class="service-price">
        ${Number(servico.preco).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        })}
      </span>
    </li>
  `).join("");
}