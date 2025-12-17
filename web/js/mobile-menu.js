// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');
  
  if (mobileMenuToggle && mobileDropdownMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuToggle.classList.toggle('active');
      mobileDropdownMenu.classList.toggle('active');
    });
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!mobileMenuToggle.contains(e.target) && !mobileDropdownMenu.contains(e.target)) {
        mobileMenuToggle.classList.remove('active');
        mobileDropdownMenu.classList.remove('active');
      }
    });
    
    // Cerrar menú al hacer click en un enlace
    mobileDropdownMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.classList.remove('active');
        mobileDropdownMenu.classList.remove('active');
      });
    });
  }
  
  // Conectar logout mobile con el existente (dropdown y perfil)
  const logoutBtnMobile = document.getElementById('logout-btn-mobile');
  const logoutBtnMobilePerfil = document.getElementById('logoutBtnMobile');
  const logoutBtn = document.getElementById('logout-btn');
  const logoutBtnPerfil = document.getElementById('logoutBtn');
  
  // Logout desde dropdown menu (sidebar)
  if (logoutBtnMobile && logoutBtn) {
    logoutBtnMobile.addEventListener('click', (e) => {
      e.preventDefault();
      logoutBtn.click();
    });
  }
  
  // Logout desde botón móvil en perfil
  if (logoutBtnMobilePerfil) {
    logoutBtnMobilePerfil.addEventListener('click', (e) => {
      e.preventDefault();
      // Si existe el botón del sidebar, usarlo
      if (logoutBtn) {
        logoutBtn.click();
      } 
      // Si no, ejecutar logout directamente (para perfil.html)
      else if (logoutBtnPerfil) {
        logoutBtnPerfil.click();
      }
      // Fallback: ejecutar logout manual
      else {
        localStorage.clear();
        window.location.href = '/vistas/login.html';
      }
    });
  }
});
