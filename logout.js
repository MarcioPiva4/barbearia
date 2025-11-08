document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    const res = await fetch("https://lipes-cortes.vercel.app/api/logout", {
      method: "POST",
    });
    const data = await res.json();

    // Função para remover cookies (setando expiração no passado)
    function deleteCookie(name) {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }

    localStorage.clear()

    // Remove todos os cookies usados no login
    deleteCookie("token");
    deleteCookie("role");
    deleteCookie("userId");

    alert(data.message || "Logout realizado");
    window.location.href = "auth.html"; // volta para login
  } catch (err) {
    console.error("Erro no logout", err);
  }
});
