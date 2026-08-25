// ========================
// Cadastro
// ========================
async function cadastrar() {
  const nome = document.getElementById("input-nome").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const data_nasc = document.getElementById("input-data").value;
  const senha = document.getElementById("input-senha").value.trim();
  const nomeAreaMentorar = document.getElementById("select-mentorar").value;
  const nomeAreaMentorado = document.getElementById("select-mentorado").value;

  try {
    const res1 = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, data_nasc, senha }),
    });

    const data1 = await res1.json();

    if (!res1.ok) {
      document.getElementById("msg").innerText = data1.error;
      return;
    }

    localStorage.setItem("token", data1.token);
    localStorage.setItem("userId", data1.userId);
    localStorage.setItem("nome", data1.nome);

    const res2 = await fetch("http://localhost:3000/registerAreas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomeAreaMentorar,
        nomeAreaMentorado,
        users_id: data1.userId,
      }),
    });

    const data2 = await res2.json();

    if (!res2.ok) {
      document.getElementById("msg").innerText = data2.message;
      return;
    }

    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    document.getElementById("msg").innerText = "Erro no cadastro.";
  }
}

// ========================
// Login
// ========================
async function login() {
  const email = document.getElementById("input-email").value.trim();
  const senha = document.getElementById("input-senha").value.trim();

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById("msg").innerText = data.error;
      document.getElementById("msg").style.color = "red";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("nome", data.nome);
    localStorage.setItem("email", data.email);

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    document.getElementById("msg").innerText = "Erro no login.";
  }
}

// ========================
// Perfil — carrega ao abrir a página
// ========================
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const nome = localStorage.getItem("nome");
  const email = localStorage.getItem("email");

  // Troca botão "Faça Login" pelo nome do usuário em qualquer página
  const loginBtn = document.querySelector(".login-btn");
  if (loginBtn) {
    if (token && nome) {
      loginBtn.textContent = nome;
      loginBtn.href = "perfil.html";
    } else {
      loginBtn.textContent = "Faça Login";
      loginBtn.href = "login.html";
    }
  }

  // -------------------------------------------------------
  // POP-UP DE LOGIN — exibe se não estiver autenticado
  // Páginas públicas (login, cadastro) ficam livres do pop-up
  // -------------------------------------------------------
  const paginasPublicas = ["login.html", "cadastrar.html"];
  const paginaAtual = window.location.pathname.split("/").pop();
  const isPaginaPublica = paginasPublicas.includes(paginaAtual);

  if (!token && !isPaginaPublica) {
    mostrarPopupLogin();
    return; // interrompe: não inicializa o site sem login
  }

  // Só roda o resto se for a página de perfil
  const isPaginaProtegida = document.getElementById("profileName");
  if (!isPaginaProtegida) {
    inicializarSite(); // página comum (home, etc.) — usuário já logado
    return;
  }

  document.getElementById("profileName").textContent = nome || "Usuário";
  document.getElementById("input-nome").value = nome || "";
  document.getElementById("profileEmail").textContent =
    email || "email@gmail.com";

  inicializarSite();
});

async function contarUsuarios() {
  try {
    const resp = await fetch("http://localhost:3000/totalUsers", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await resp.json();

    if (resp.ok) {
      const footerMsgPopUp = document.getElementById("p-footer-msg");
      if (footerMsgPopUp) {
        footerMsgPopUp.innerHTML = `
          <i class="ri-group-line" style="font-size:13px; vertical-align:-2px; margin-right:4px;"></i>
          Junte-se a ${data.total_users} estudantes que já estão crescendo juntos!
        `;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// ========================
// Pop-up de login
// ========================
function mostrarPopupLogin() {
  // Cria o overlay
  const overlay = document.createElement("div");
  overlay.id = "login-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(20, 8, 50, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: popupFadeIn .25s ease;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes popupFadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes popupSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    </style>

    <div style="
      background: #2d1a5e;
      border-radius: 18px;
      border: 1.5px solid rgba(240, 202, 36, 0.25);
      padding: 2.5rem 2rem 2rem;
      max-width: 390px;
      width: 90%;
      position: relative;
      animation: popupSlideUp .3s ease;
      font-family: 'DM Sans', sans-serif;
    ">

      <!-- Logo -->
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:1.5rem;">
        <div style="
          width:38px; height:38px;
          background:#f0ca24;
          border-radius:10px;
          display:flex; align-items:center; justify-content:center;
        ">
          <img src="../assets/logo/logo.png" alt="Hive" style="width:24px; height:24px; border-radius:6px;" />
        </div>
        <span style="font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#f0ca24;">
          Hive Study Club
        </span>
      </div>

      <!-- Alerta -->
      <div style="
        background: rgba(240,202,36,0.10);
        border: 1px solid rgba(240,202,36,0.30);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      ">
        <i class="ri-lock-line" style="font-size:18px; color:#f0ca24; margin-top:2px; flex-shrink:0;"></i>
        <p style="margin:0; font-size:14px; color:#e0d8ff; line-height:1.5;">
          Para acessar o conteúdo da plataforma, você precisa estar logado.
        </p>
      </div>

      <!-- Título -->
      <h2 style="font-family:'Syne',sans-serif; font-size:22px; font-weight:700; color:#fff; margin:0 0 .35rem; line-height:1.2;">
        Faça login para continuar
      </h2>
      <p style="font-size:14px; color:#a899d4; line-height:1.5; margin:0 0 1.75rem;">
        Conecte-se com estudantes, compartilhe conhecimento e alcance seus objetivos em grupo.
      </p>

      <!-- Botões -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="login.html" style="
          background: #f0ca24;
          color: #1a0f00;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          border-radius: 40px;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: opacity .15s;
        " onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
          <i class="ri-login-box-line"></i> Fazer Login
        </a>
        <a href="cadastrar.html" style="
          background: transparent;
          color: #d0c8f0;
          border: 1.5px solid rgba(208,200,240,0.35);
          font-size: 14px;
          font-weight: 500;
          border-radius: 40px;
          padding: 0.72rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background .15s;
        " onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='transparent'">
          Criar uma conta grátis
        </a>
      </div>

      <!-- Rodapé -->
      <p id="p-footer-msg" style="margin:1.25rem 0 0; font-size:12px; color:#7a6fa8; text-align:center;">
  <i class="ri-group-line" style="font-size:13px; vertical-align:-2px; margin-right:4px;"></i>
  Carregando...
</p>

    </div>
  `;

  document.body.appendChild(overlay);
  contarUsuarios();
}

// ========================
// Inicializa o site
// ========================
function inicializarSite() {
  const topHeader = document.getElementById("top-header");
  const burgerBtn = document.getElementById("burgerBtn");
  const sideMenu = document.getElementById("sideMenu");
  const navOverlay = document.getElementById("navOverlay");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const burgerIcon = document.getElementById("burgerIcon");

  if (!topHeader) return; // página sem header (ex.: login/cadastro)

  window.addEventListener("scroll", () => {
    topHeader.classList.toggle("is-scrolled", window.scrollY > 20);
  });

  function openMenu() {
    sideMenu.classList.add("is-open");
    navOverlay.classList.add("is-open");
    burgerIcon.className = "ri-close-line";
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    sideMenu.classList.remove("is-open");
    navOverlay.classList.remove("is-open");
    burgerIcon.className = "ri-menu-3-line";
    document.body.style.overflow = "";
  }

  burgerBtn.addEventListener("click", () =>
    sideMenu.classList.contains("is-open") ? closeMenu() : openMenu(),
  );
  closeMenuBtn.addEventListener("click", closeMenu);
  navOverlay.addEventListener("click", closeMenu);

  const featureCards = document.querySelectorAll(".feature-card");
  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("is-visible"), i * 100);
        }
      });
    },
    { threshold: 0.1 },
  );
  featureCards.forEach((card) => cardObserver.observe(card));
}

// ========================
// Editar perfil
// ========================
async function editarUser() {
  const token = localStorage.getItem("token");
  const inputNome = document.getElementById("input-nome").value.trim();
  const inputSenha = document.getElementById("input-senha").value.trim();

  if (!inputNome || !inputSenha) {
    alert("Preencha nome e nova senha para salvar.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/editarUser", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ inputNome, inputSenha }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("nome", data.nome);
      document.getElementById("profileName").textContent = data.nome;
      alert("Perfil atualizado com sucesso!");
    } else if (response.status === 401) {
      alert("Sessão expirada. Faça login novamente.");
      localStorage.clear();
      window.location.href = "login.html";
    } else {
      alert(data.error || "Erro ao editar.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro de conexão.");
  }
}

// ========================
// Logout
// ========================
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// =========================
//RANKING
// =========================

async function gerarRanking() {
  try {
    const resp = await fetch("http://localhost:3000/ranking", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await resp.json();

    if (!resp.ok ) return;

   
    const mainContent = document.getElementById("main-content");

    mainContent.innerHTML = `<!-- Page Header -->
      <div class="page-header">
        <div class="page-header-tag">
          <i class="ri-sparkling-line"></i> Atualizado semanalmente
        </div>
        <h1 class="page-title">Ranking dos <span>Melhores</span></h1>
        <p class="page-subtitle">
          Os estudantes mais dedicados da semana. Estude mais para subir de
          posição!
        </p>
      </div>

      <!-- Podium (top 3) -->
      <div class="podium">
        <!-- 2nd -->
        <div class="podium-item podium-2nd">
          <div class="podium-avatar">
            <img src="/frontend/src/assets/icons/imagem_user.png" alt="2º lugar" />
            <span class="podium-medal silver"
              ><i class="ri-medal-fill"></i
            ></span>
          </div>
          <p class="podium-name">${data[1].nome}</p>
          <p class="podium-pts">${data[1].pontos} pts</p>
          <div class="podium-block podium-block--2">2º</div>
        </div>

        <!-- 1st -->
        <div class="podium-item podium-1st">
          <div class="podium-crown"><i class="ri-vip-crown-fill"></i></div>
          <div class="podium-avatar">
            <img src="/frontend/src/assets/icons/imagem_user.png" alt="1º lugar" />
            <span class="podium-medal gold"><i class="ri-medal-fill"></i></span>
          </div>
          <p class="podium-name">${data[0].nome}</p>
          <p class="podium-pts">${data[0].pontos} pts</p>
          <div class="podium-block podium-block--1">1º</div>
        </div>

        <!-- 3rd -->
        <div class="podium-item podium-3rd">
          <div class="podium-avatar">
            <img src="/frontend/src/assets/icons/imagem_user.png" alt="3º lugar" />
            <span class="podium-medal bronze"
              ><i class="ri-medal-fill"></i
            ></span>
          </div>
          <p class="podium-name">${data[2].nome}</p>
          <p class="podium-pts">${data[2].pontos} pts</p>
          <div class="podium-block podium-block--3">3º</div>
        </div>
      </div>

      <!-- List (4th) -->
      <div class="ranking-list">
        <div class="ranking-list-header">
          <span>Posição</span>
          <span>Estudante</span>
          <span>Pontos</span>
          <span>Variação</span>
        </div>

        <div class="ranking-row" style="animation-delay: 0s">
          <div class="rank-pos">4</div>
          <div class="rank-user">
            <div class="rank-avatar">U</div>
            <div>
              <p class="rank-name">${data[3].nome}</p>
            </div>
          </div>
          <div class="rank-pts">${data[3].pontos} <span>pts</span></div>
          <div class="rank-change up"><i class="ri-arrow-up-s-fill"></i></div>
        </div>

        <div class="ranking-row" style="animation-delay: 0.06s">
          <div class="rank-pos">5</div>
          <div class="rank-user">
            <div class="rank-avatar">U</div>
            <div>
              <p class="rank-name">${data[4].nome}</p>
            </div>
          </div>
          <div class="rank-pts">${data[4].pontos} <span>pts</span></div>
          <div class="rank-change down">
            <i class="ri-arrow-down-s-fill"></i>
          </div>
        </div>

        <div class="ranking-row" style="animation-delay: 0.12s">
          <div class="rank-pos">6</div>
          <div class="rank-user">
            <div class="rank-avatar">U</div>
            <div>
              <p class="rank-name">${data[5].nome}</p>
            </div>
          </div>
          <div class="rank-pts">${data[5].pontos} <span>pts</span></div>
          <div class="rank-change same"><i class="ri-subtract-line"></i></div>
        </div>

        <div class="ranking-row" style="animation-delay: 0.18s">
          <div class="rank-pos">7</div>
          <div class="rank-user">
            <div class="rank-avatar">U</div>
            <div>
              <p class="rank-name">${data[6].nome}</p>
            </div>
          </div>
          <div class="rank-pts">${data[6].pontos} <span>pts</span></div>
          <div class="rank-change up"><i class="ri-arrow-up-s-fill"></i></div>
        </div>
      </div>
`


  } catch (err) {
    console.error(err);
    document.getElementById("loading").textContent = "Erro ao carregar ranking.";
  }
}




//===========================
// Pagina Sobre
//=========================== 


async function UsuariosAtivosSobre() {
  try {
    const resp = await fetch("http://localhost:3000/totalUsers", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await resp.json();

    if (resp.ok) {
      const estudantesAtivos = document.getElementById("estudantesAtivos");
      if (estudantesAtivos) {
        estudantesAtivos.textContent = data.total_users;
      }
    }
  } catch (err) {
    console.error(err);
  }
}
//===========================
// Pagina Home
//=========================== 


async function UsuariosAtivosHome() {
  try {
    const resp = await fetch("http://localhost:3000/totalUsers", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await resp.json();

    if (resp.ok) {
      const estudantesAtivosHome = document.getElementById("estudantesAtivosHome");
      if (estudantesAtivosHome) {
        estudantesAtivosHome.textContent = data.total_users;
      }
    }
  } catch (err) {
    console.error(err);
  }
}



async function carregarPontosPerfil(){

  const id = localStorage.getItem("userId"); // pega o id do usuário logado

  if(!id) return; 
  
  try {
    const resp = await fetch(`http://localhost:3000/getPontosUser/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await resp.json();

    if (resp.ok) {
      const pontos = document.getElementById("pontos");
      if (pontos) {
        pontos.textContent = data.pontos;
      }
    }
  } catch (err) {
    console.error(err);
  }

}
carregarPontosPerfil();
