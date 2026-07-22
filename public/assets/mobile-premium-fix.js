(function(){
  function setTheme(mode){
    const isDark = mode === 'dark';
    if (document.body) document.body.classList.toggle('dark-theme', isDark);
    document.documentElement.classList.toggle('dark-theme', isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.querySelectorAll('#themeToggle i, .theme-toggle i').forEach(icon => {
      icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });
    document.querySelectorAll('#themeToggle, .theme-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.title = isDark ? 'Açıq tema' : 'Qaranlıq tema';
    });
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch(e) {}
  }
  function initBodyState(){
    const logged = !!document.querySelector('.evva-profile-menu, .current-user-chip, [data-user-menu-button]');
    document.body.classList.toggle('evva-auth-ui', logged);
    document.body.classList.toggle('evva-guest-ui', !logged);
  }
  function initTheme(){
    if (document.querySelector('[data-react-theme-toggle]')) return;
    let saved = 'light';
    try { saved = localStorage.getItem('theme') || 'light'; } catch(e) {}
    setTheme(saved === 'dark' ? 'dark' : 'light');
    document.querySelectorAll('#themeToggle, .theme-toggle').forEach(btn => {
      if (btn.dataset.evvaThemeBound === '1') return;
      btn.dataset.evvaThemeBound = '1';
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        const next = (document.body && document.body.classList.contains('dark-theme')) ? 'light' : 'dark';
        setTheme(next);
      });
    });
  }
  function closeAllProfileMenus(except){
    document.querySelectorAll('.user-dropdown.show, .evva-profile-dropdown.show').forEach(menu => {
      if (menu !== except) menu.classList.remove('show');
    });
    document.querySelectorAll('[data-user-menu-button], #userMenuBtn, .evva-profile-button').forEach(btn => {
      const wrap = btn.closest('.user-menu, .evva-profile-menu') || document;
      const menu = wrap.querySelector('[data-user-menu-panel], #userDropdown, .user-dropdown, .evva-profile-dropdown');
      if (menu !== except) btn.setAttribute('aria-expanded','false');
    });
  }
  function initProfileDropdown(){
    document.querySelectorAll('[data-user-menu-button], #userMenuBtn, .evva-profile-button, .user-btn, .profile-trigger').forEach(btn => {
      if (btn.dataset.evvaDropdownBound === '1') return;
      btn.dataset.evvaDropdownBound = '1';
      btn.addEventListener('click', function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        const wrap = btn.closest('.user-menu, .evva-profile-menu') || document;
        const menu = wrap.querySelector('[data-user-menu-panel], #userDropdown, .user-dropdown, .evva-profile-dropdown');
        if (menu) {
          const open = !menu.classList.contains('show');
          closeAllProfileMenus(menu);
          menu.classList.toggle('show', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
      });
    });
    document.addEventListener('click', function(ev){
      if (ev.target.closest('.user-menu, .evva-profile-menu')) return;
      closeAllProfileMenus(null);
    });
    if (!document.documentElement.dataset.evvaDropdownDelegated) {
      document.documentElement.dataset.evvaDropdownDelegated = '1';
      document.addEventListener('click', function(ev){
        const btn = ev.target.closest('[data-user-menu-button], .evva-profile-button, #userMenuBtn');
        if (!btn) return;
        const wrap = btn.closest('.user-menu, .evva-profile-menu') || document;
        const menu = wrap.querySelector('[data-user-menu-panel], #userDropdown, .user-dropdown, .evva-profile-dropdown');
        if (!menu) return;
        ev.preventDefault();
        ev.stopPropagation();
        const open = !menu.classList.contains('show');
        closeAllProfileMenus(menu);
        menu.classList.toggle('show', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }, true);
    }
  }
  function initMobileFilters(){
    document.querySelectorAll('[data-filter-toggle]').forEach(btn => {
      if (btn.dataset.evvaFilterBound === '1') return;
      btn.dataset.evvaFilterBound = '1';
      btn.addEventListener('click', function(){
        const selector = btn.getAttribute('data-filter-toggle');
        const panel = selector ? document.querySelector(selector) : null;
        if (!panel) return;
        const open = panel.classList.toggle('is-open');
        btn.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        const label = btn.querySelector('span');
        if (label) label.textContent = open ? 'Əlavə filterləri bağla' : 'Daha çox filter seç';
      });
    });
  }
  function initBookingDetails(){
    document.querySelectorAll('[data-booking-detail-toggle]').forEach(btn => {
      if (btn.dataset.evvaBookingBound === '1') return;
      btn.dataset.evvaBookingBound = '1';
      btn.addEventListener('click', function(){
        const card = btn.closest('.booking-card-compact');
        if (!card) return;
        const open = card.classList.toggle('details-open');
        btn.innerHTML = open ? '<i class="fas fa-eye-slash"></i> Bağla' : '<i class="fas fa-circle-info"></i> Daha ətraflı';
      });
    });
  }
  function initChatMobile(){
    if (!document.body.classList.contains('chat-fixed-page')) return;
    const panel = document.getElementById('chatPanel');
    const messages = document.getElementById('chatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
    // WhatsApp-style mobile view keeps the conversation list and chat panel visible side-by-side; no auto-scroll to the panel.
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', function(){
        document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active-tap'));
        item.classList.add('active-tap');
      }, {passive:true});
    });
  }
  function init(){
    initBodyState();
    initTheme();
    initProfileDropdown();
    initMobileFilters();
    initBookingDetails();
    initChatMobile();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* 2026-06-09: final delegated profile menu fallback */
(function(){
  function closeMenus(except){
    document.querySelectorAll('.user-dropdown.show,.evva-profile-dropdown.show,[data-user-menu-panel].show').forEach(function(menu){
      if (menu !== except) menu.classList.remove('show');
    });
    document.querySelectorAll('[data-user-menu-button],#userMenuBtn,.user-btn,.evva-profile-button,.profile-trigger').forEach(function(btn){
      var wrap = btn.closest('.user-menu,.evva-profile-menu') || document;
      var menu = wrap.querySelector('[data-user-menu-panel],#userDropdown,.user-dropdown,.evva-profile-dropdown');
      if (menu !== except) btn.setAttribute('aria-expanded','false');
    });
  }
  document.addEventListener('click', function(ev){
    var btn = ev.target.closest('[data-user-menu-button],#userMenuBtn,.user-btn,.evva-profile-button,.profile-trigger');
    if (btn) {
      ev.preventDefault();
      ev.stopPropagation();
      var wrap = btn.closest('.user-menu,.evva-profile-menu') || document;
      var menu = wrap.querySelector('[data-user-menu-panel],#userDropdown,.user-dropdown,.evva-profile-dropdown');
      if (!menu) return;
      var open = !menu.classList.contains('show');
      closeMenus(menu);
      menu.classList.toggle('show', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }
    if (!ev.target.closest('.user-menu,.evva-profile-menu,.user-dropdown,.evva-profile-dropdown')) closeMenus(null);
  }, true);
})();

/* EVVA 2026-06-09: hard profile dropdown repair across desktop/mobile */
(function(){
  function findMenu(btn){
    var wrap = btn.closest('.user-menu,.evva-profile-menu') || btn.parentElement || document;
    return wrap.querySelector('[data-user-menu-panel],.user-dropdown,.evva-profile-dropdown,#userDropdown');
  }
  function closeAll(except){
    document.querySelectorAll('[data-user-menu-panel].show,.user-dropdown.show,.evva-profile-dropdown.show,#userDropdown.show').forEach(function(menu){
      if(menu !== except) menu.classList.remove('show');
    });
    document.querySelectorAll('[data-user-menu-button],#userMenuBtn,.user-btn,.evva-profile-button,.profile-trigger').forEach(function(btn){
      var menu = findMenu(btn);
      if(menu !== except) btn.setAttribute('aria-expanded','false');
    });
  }
  function toggle(btn, ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    var menu = findMenu(btn);
    if(!menu) return false;
    var open = !menu.classList.contains('show');
    closeAll(menu);
    menu.classList.toggle('show', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    return false;
  }
  document.addEventListener('click', function(ev){
    var btn = ev.target.closest('[data-user-menu-button],#userMenuBtn,.user-btn,.evva-profile-button,.profile-trigger');
    if(btn) return toggle(btn, ev);
    if(!ev.target.closest('.user-menu,.evva-profile-menu,.user-dropdown,.evva-profile-dropdown')) closeAll(null);
  }, true);
  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Escape') closeAll(null);
  });
  window.evvaProfileDropdownRepair = {toggle: toggle, closeAll: closeAll};
})();


/* EVVA idle logout client fallback: 20 minutes without activity */
(function(){
  function loggedIn(){ return !!document.querySelector('.evva-profile-menu,[data-user-menu-button],.current-user-chip'); }
  if(!loggedIn() || document.documentElement.dataset.evvaIdleLogoutBound === '1') return;
  document.documentElement.dataset.evvaIdleLogoutBound = '1';
  var limit = 20 * 60 * 1000;
  var timer = null;
  function basePath(){
    var path = window.location.pathname || '/';
    path = path.replace(/\/(admin|api|places|rentals|restaurants)\/.*$/i, '/');
    path = path.replace(/\/[^/]*$/i, '/');
    return path || '/';
  }
  function logoutUrl(){
    var base = basePath();
    return /\/admin\//i.test(window.location.pathname || '') ? (base + 'admin/logout.php?idle=1') : (base + 'logout.php?idle=1');
  }
  function reset(){
    clearTimeout(timer);
    timer = setTimeout(function(){ window.location.href = logoutUrl(); }, limit);
  }
  ['click','keydown','mousemove','touchstart','scroll','focus'].forEach(function(evt){ window.addEventListener(evt, reset, {passive:true}); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) reset(); });
  reset();
})();
