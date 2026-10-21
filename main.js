document.addEventListener('DOMContentLoaded', () => {
  syncSidebarUser();
  initDashboardHome();
  initStockModule();
  initTabs();
  initProjectsModule();
  initCalendarModule();
  initContactModule();
  initQuoteCalculatorModule();
});

/* ===================================================
   SINCRONIZACIÓN DE USUARIO Y TALLER EN EL SIDEBAR
   =================================================== */
function syncSidebarUser() {
  const userBadge = document.querySelector('.user-badge');
  const shopBrand = document.querySelector('.sidebar__brand .placeholder-box');

  const savedOwner = localStorage.getItem('taller_perfil_dueno');
  if (savedOwner && userBadge) {
    const owner = JSON.parse(savedOwner);
    if (owner.name) {
      userBadge.textContent = `${owner.name} — ${owner.role || 'dueño'}`;
    }
  }

  const savedShop = localStorage.getItem('taller_perfil_taller');
  if (savedShop && shopBrand) {
    const shop = JSON.parse(savedShop);
    if (shop.name) {
      shopBrand.textContent = shop.name;
    }
  }
}

/* ===================================================
   0. MÓDULO DE DASHBOARD / INICIO (HOME DINÁMICO)
   =================================================== */
function initDashboardHome() {
  const kpiProyectos = document.getElementById('kpi-proyectos-activos');
  const kpiClientes = document.getElementById('kpi-clientes-activos');
  const kpiExperiencia = document.getElementById('kpi-experiencia');
  const projectsList = document.getElementById('home-recent-projects');
  const materialsList = document.getElementById('home-material-prices');

  if (!kpiProyectos || !projectsList) return;

  const savedOwner = localStorage.getItem('taller_perfil_dueno');
  if (savedOwner && kpiExperiencia) {
    const owner = JSON.parse(savedOwner);
    if (owner.exp) {
      kpiExperiencia.textContent = `${owner.exp} años`;
    }
  }

  const defaultProjects = [
    { id: 'p1', name: 'Estructura Galpón Depósito', client: 'Logística del Valle S.A.', status: 'en-curso' },
    { id: 'p2', name: 'Portón Corredizo Automatizado', client: 'Martín Gómez', status: 'en-curso' },
    { id: 'p3', name: 'Lote 350 Bicleteros Urbanos', client: 'Municipio / Obra Pública', status: 'finalizados' },
    { id: 'p4', name: 'Escalera Caracol Perfil U', client: 'Estudio Arq. Romero', status: 'presupuestos' }
  ];

  const rawProjects = localStorage.getItem('taller_proyectos');
  const projects = rawProjects ? JSON.parse(rawProjects) : defaultProjects;

  const activos = projects.filter(p => p.status === 'en-curso');
  kpiProyectos.textContent = activos.length;

  const clientesUnicos = new Set(activos.map(p => p.client.trim().toLowerCase()));
  if (kpiClientes) {
    kpiClientes.textContent = clientesUnicos.size;
  }

  const badgeMap = {
    'en-curso': 'En Curso',
    'finalizados': 'Finalizado',
    'presupuestos': 'Presupuesto'
  };

  projectsList.innerHTML = '';
  const recentProjects = projects.slice(0, 4);

  if (recentProjects.length === 0) {
    projectsList.innerHTML = `<li style="color: var(--color-text-muted); text-align: center; padding: 1rem;">No hay proyectos registrados.</li>`;
  } else {
    recentProjects.forEach(p => {
      const li = document.createElement('li');
      li.className = 'item-list__row';
      li.innerHTML = `
        <span><strong>${p.name}</strong> — ${p.client}</span>
        <span class="badge">${badgeMap[p.status] || 'Estado'}</span>
      `;
      projectsList.appendChild(li);
    });
  }

  const defaultMaterials = [
    { id: '1', nombre: 'Tubo estructural 40x40x1.6', precio: 28500 },
    { id: '2', nombre: 'Perfil ángulo 1" x 1/8"', precio: 14200 },
    { id: '3', nombre: 'Chapa lisa BWG 18 (1.2mm)', precio: 45000 },
    { id: '4', nombre: 'Aluminio 6061 estructural', precio: 32000 }
  ];

  const rawMaterials = localStorage.getItem('taller_materiales_stock');
  const materials = rawMaterials ? JSON.parse(rawMaterials) : defaultMaterials;

  function formatCurrency(val) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(val);
  }

  if (materialsList) {
    materialsList.innerHTML = '';
    const displayMaterials = materials.slice(0, 4);

    if (displayMaterials.length === 0) {
      materialsList.innerHTML = `<li style="color: var(--color-text-muted); text-align: center; padding: 1rem;">No hay materiales cargados.</li>`;
    } else {
      displayMaterials.forEach(m => {
        const li = document.createElement('li');
        li.className = 'item-list__row';
        li.innerHTML = `
          <span>${m.nombre}</span>
          <span class="material-price">${formatCurrency(m.precio)}</span>
        `;
        materialsList.appendChild(li);
      });
    }
  }
}

/* ===================================================
   1. MÓDULO DE COTIZADOR Y STOCK (CON LOCALSTORAGE)
   =================================================== */
function initStockModule() {
  const searchInput = document.getElementById('search-material');
  const table = document.querySelector('.data-table');
  const tableBody = table?.querySelector('tbody');
  const modal = document.getElementById('modal-material');
  const btnOpen = document.getElementById('btn-open-modal');
  const btnClose = document.getElementById('btn-close-modal');
  const btnCancel = document.getElementById('btn-cancel-modal');
  const form = document.getElementById('form-material');

  if (!tableBody) return;

  const STORAGE_KEY = 'taller_materiales_stock';

  const defaultMaterials = [
    { id: '1', nombre: 'Tubo estructural 40x40x1.6', unidad: 'Barra 6m', stock: 14, minimo: 5, precio: 28500 },
    { id: '2', nombre: 'Perfil ángulo 1" x 1/8"', unidad: 'Barra 6m', stock: 2, minimo: 6, precio: 14200 },
    { id: '3', nombre: 'Chapa lisa BWG 18 (1.2mm)', unidad: 'Hoja 1x2m', stock: 8, minimo: 3, precio: 45000 }
  ];

  function getMaterials() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultMaterials;
  }

  function saveMaterials(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(val);
  }

  function renderTable() {
    const list = getMaterials();
    const filterText = searchInput ? searchInput.value.toLowerCase().trim() : '';

    tableBody.innerHTML = '';

    const filtered = list.filter(item => item.nombre.toLowerCase().includes(filterText));

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 1.5rem;">No se encontraron materiales.</td></tr>`;
      return;
    }

    filtered.forEach(item => {
      const row = document.createElement('tr');
      if (item.stock < item.minimo) {
        row.classList.add('row--warning');
      }

      row.innerHTML = `
        <td>${item.nombre}</td>
        <td>${item.unidad}</td>
        <td>${item.stock}</td>
        <td>${item.minimo}</td>
        <td>${formatCurrency(item.precio)}</td>
        <td class="text-center actions-cell">
          <button class="btn-action btn-delete" data-id="${item.id}" title="Eliminar">🗑️</button>
        </td>
      `;

      row.querySelector('.btn-delete').addEventListener('click', () => {
        const currentList = getMaterials().filter(m => m.id !== item.id);
        saveMaterials(currentList);
        renderTable();
      });

      tableBody.appendChild(row);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderTable);
  }

  if (modal && btnOpen && form) {
    const openModal = () => modal.classList.add('is-visible');
    const closeModal = () => {
      modal.classList.remove('is-visible');
      form.reset();
    };

    btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newMaterial = {
        id: Date.now().toString(),
        nombre: document.getElementById('mat-nombre').value.trim(),
        unidad: document.getElementById('mat-unidad').value.trim(),
        stock: parseFloat(document.getElementById('mat-stock').value) || 0,
        minimo: parseFloat(document.getElementById('mat-minimo').value) || 0,
        precio: parseFloat(document.getElementById('mat-precio').value) || 0
      };

      const currentList = getMaterials();
      currentList.unshift(newMaterial);
      saveMaterials(currentList);

      closeModal();
      renderTable();
    });
  }

  renderTable();
}

/* ===================================================
   2. CONTROLADOR GENÉRICO DE PESTAÑAS (TABS)
   =================================================== */
function initTabs() {
  const tabsNavs = document.querySelectorAll('.tabs-nav:not(.project-tabs):not(.cal-tabs)');

  tabsNavs.forEach((nav) => {
    const buttons = nav.querySelectorAll('.tab-btn');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        if (!targetId) return;

        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const container = nav.closest('.dashboard-content');
        if (!container) return;

        const contents = container.querySelectorAll('.tab-content');
        contents.forEach((content) => content.classList.remove('active'));

        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  });
}

/* ===================================================
   3. MÓDULO DE PROYECTOS (CON LOCALSTORAGE)
   =================================================== */
function initProjectsModule() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  const tabButtons = document.querySelectorAll('.project-tabs .tab-btn');
  const searchInput = document.getElementById('search-project');
  const modal = document.getElementById('modal-project');
  const btnOpen = document.getElementById('btn-open-project-modal');
  const btnClose = document.getElementById('btn-close-project-modal');
  const btnCancel = document.getElementById('btn-cancel-project-modal');
  const form = document.getElementById('form-project');

  const STORAGE_KEY = 'taller_proyectos';

  const defaultProjects = [
    {
      id: 'p1',
      name: 'Estructura Galpón Depósito',
      client: 'Logística del Valle S.A.',
      status: 'en-curso',
      progress: 65,
      start: '01/08/26',
      end: '30/09/26',
      budget: 3450000
    },
    {
      id: 'p2',
      name: 'Portón Corredizo Automatizado',
      client: 'Martín Gómez',
      status: 'en-curso',
      progress: 40,
      start: '10/08/26',
      end: '25/08/26',
      budget: 780000
    },
    {
      id: 'p3',
      name: 'Lote 350 Bicleteros Urbanos',
      client: 'Municipio / Obra Pública',
      status: 'finalizados',
      progress: 100,
      start: '15/06/26',
      end: '30/07/26',
      budget: 5120000
    },
    {
      id: 'p4',
      name: 'Escalera Caracol Perfil U',
      client: 'Estudio Arq. Romero',
      status: 'presupuestos',
      progress: 0,
      start: 'A definir',
      end: 'A definir',
      budget: 1250000
    }
  ];

  let currentFilter = 'en-curso';
  let searchTerm = '';

  function getProjects() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultProjects;
  }

  function saveProjects(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function formatBudget(val) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(val);
  }

  const badgeMap = {
    'en-curso': 'En Curso',
    'finalizados': 'Finalizado',
    'presupuestos': 'Presupuesto'
  };

  function renderProjects() {
    const list = getProjects();
    container.innerHTML = '';

    const filtered = list.filter(p => {
      const matchesStatus = p.status === currentFilter;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.client.toLowerCase().includes(searchTerm);
      return matchesStatus && matchesSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted); padding: 2rem 0;">No hay proyectos para este estado o búsqueda.</p>`;
      return;
    }

    filtered.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card project-card';
      card.setAttribute('data-status', p.status);

      card.innerHTML = `
        <div class="project-card__header">
          <div class="project-title-text">${p.name}</div>
          <span class="badge">${badgeMap[p.status] || 'Estado'}</span>
        </div>
        <div class="project-client-text">${p.client}</div>
        <div class="project-stats-grid">
          <div class="stat-box">
            <span class="stat-box__label">Inicio</span>
            <div class="value-placeholder">${p.start}</div>
          </div>
          <div class="stat-box">
            <span class="stat-box__label">Entrega est.</span>
            <div class="value-placeholder">${p.end}</div>
          </div>
          <div class="stat-box">
            <span class="stat-box__label">Presupuesto</span>
            <div class="value-placeholder">${formatBudget(p.budget)}</div>
          </div>
        </div>
        <div class="project-progress">
          <div class="project-progress__labels">
            <span>Avance</span>
            <span class="progress-percent">${p.progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width: ${p.progress}%;"></div>
          </div>
        </div>
        <div class="project-card__actions">
          <button class="btn btn--secondary btn--full">Ver detalle</button>
          <button class="btn btn--secondary btn--full">Ver presupuesto</button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderProjects();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      renderProjects();
    });
  }

  if (modal && btnOpen && form) {
    const openModal = () => modal.classList.add('is-visible');
    const closeModal = () => {
      modal.classList.remove('is-visible');
      form.reset();
    };

    btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newProj = {
        id: Date.now().toString(),
        name: document.getElementById('proj-name').value.trim(),
        client: document.getElementById('proj-client').value.trim(),
        status: document.getElementById('proj-status').value,
        progress: parseInt(document.getElementById('proj-progress').value, 10) || 0,
        start: document.getElementById('proj-start').value || 'A definir',
        end: document.getElementById('proj-end').value || 'A definir',
        budget: parseFloat(document.getElementById('proj-budget').value) || 0
      };

      const currentList = getProjects();
      currentList.unshift(newProj);
      saveProjects(currentList);

      closeModal();
      renderProjects();
    });
  }

  renderProjects();
}

/* ===================================================
   4. MÓDULO DE CALENDARIO (CON LOCALSTORAGE)
   =================================================== */
function initCalendarModule() {
  const daysContainer = document.getElementById('calendar-days-container');
  const monthTitle = document.getElementById('calendar-current-month');
  if (!daysContainer || !monthTitle) return;

  const btnPrev = document.getElementById('btn-prev-month');
  const btnNext = document.getElementById('btn-next-month');
  const eventsList = document.getElementById('events-list-container');
  const panelTitle = document.getElementById('events-panel-title');
  const tabButtons = document.querySelectorAll('.cal-tabs .tab-btn');
  const modal = document.getElementById('modal-event');
  const btnOpen = document.getElementById('btn-open-event-modal');
  const btnClose = document.getElementById('btn-close-event-modal');
  const btnCancel = document.getElementById('btn-cancel-event-modal');
  const form = document.getElementById('form-event');

  const STORAGE_KEY = 'taller_calendario_eventos';

  const defaultEvents = [
    { id: 'e1', date: '2026-08-05', desc: 'Entrega de rejas de seguridad', related: 'Cliente: Gómez', cat: 'entregas' },
    { id: 'e2', date: '2026-08-12', desc: 'Entrega de portón levadizo', related: 'Obra San Martín', cat: 'entregas' },
    { id: 'e3', date: '2026-08-18', desc: 'Instalación baranda inox', related: 'Estudio Arq. Romero', cat: 'entregas' },
    { id: 'e4', date: '2026-08-23', desc: 'Llegada perfilería estructural', related: 'Proveedor: Aceros Cuyanos', cat: 'materiales' },
    { id: 'e5', date: '2026-08-28', desc: 'Montaje de tinglado taller', related: 'Cliente: Transporte López', cat: 'montajes' }
  ];

  let currentDate = new Date(2026, 7, 1);
  let activeCategory = 'entregas';

  function getEvents() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultEvents;
  }

  function saveEvents(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const events = getEvents();

    monthTitle.textContent = `${monthNames[month]} ${year}`;
    daysContainer.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startingDay = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startingDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-cell is-empty';
      daysContainer.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';

      const daySpan = document.createElement('span');
      daySpan.className = 'day-number';
      daySpan.textContent = day;
      cell.appendChild(daySpan);

      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;

      const dayEvents = events.filter(ev => ev.date === dateStr && ev.cat === activeCategory);
      dayEvents.forEach(ev => {
        const pill = document.createElement('div');
        pill.className = 'cal-event-pill';
        pill.textContent = ev.desc;
        pill.title = `${ev.desc} (${ev.related})`;
        cell.appendChild(pill);
      });

      daysContainer.appendChild(cell);
    }
  }

  function renderEventsList() {
    eventsList.innerHTML = '';
    const events = getEvents();
    const filtered = events.filter(ev => ev.cat === activeCategory);

    if (filtered.length === 0) {
      eventsList.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 1rem 0;">No hay eventos en esta categoría.</p>';
      return;
    }

    filtered.forEach(ev => {
      const [y, m, d] = ev.date.split('-');
      const formattedDate = `${d}/${m}/${y}`;

      const item = document.createElement('article');
      item.className = 'event-item';
      item.innerHTML = `
        <div class="event-item__row">${formattedDate}</div>
        <div class="event-item__row">${ev.desc}</div>
        <div class="event-item__row event-item__row--muted">${ev.related}</div>
      `;
      eventsList.appendChild(item);
    });
  }

  btnPrev.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  btnNext.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeCategory = btn.getAttribute('data-cal-cat');
      panelTitle.textContent = `EVENTOS — ${btn.textContent.toUpperCase()}`;

      renderCalendar();
      renderEventsList();
    });
  });

  if (modal && btnOpen && form) {
    const openModal = () => modal.classList.add('is-visible');
    const closeModal = () => {
      modal.classList.remove('is-visible');
      form.reset();
    };

    btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newEvent = {
        id: Date.now().toString(),
        date: document.getElementById('ev-date').value,
        desc: document.getElementById('ev-desc').value.trim(),
        related: document.getElementById('ev-related').value.trim(),
        cat: document.getElementById('ev-cat').value
      };

      const currentEvents = getEvents();
      currentEvents.push(newEvent);
      saveEvents(currentEvents);

      closeModal();
      renderCalendar();
      renderEventsList();
    });
  }

  renderCalendar();
  renderEventsList();
}

/* ===================================================
   5. MÓDULO DE CONTACTO Y PERFIL (CON LOCALSTORAGE)
   =================================================== */
function initContactModule() {
  const formOwner = document.getElementById('form-owner');
  const formShop = document.getElementById('form-shop');

  if (!formOwner || !formShop) return;

  const inputOwnerName = document.getElementById('owner-name');
  const inputOwnerRole = document.getElementById('owner-role');
  const inputOwnerCity = document.getElementById('owner-city');
  const inputOwnerExp = document.getElementById('owner-exp');

  const inputShopName = document.getElementById('shop-name');
  const inputShopDesc = document.getElementById('shop-desc');
  const inputShopYear = document.getElementById('shop-year');
  const inputShopArea = document.getElementById('shop-area');

  const savedOwner = localStorage.getItem('taller_perfil_dueno');
  if (savedOwner) {
    const owner = JSON.parse(savedOwner);
    if (inputOwnerName) inputOwnerName.value = owner.name || '';
    if (inputOwnerRole) inputOwnerRole.value = owner.role || '';
    if (inputOwnerCity) inputOwnerCity.value = owner.city || '';
    if (inputOwnerExp) inputOwnerExp.value = owner.exp || '';
  } else {
    if (inputOwnerName) inputOwnerName.value = 'Luis Suárez';
    if (inputOwnerRole) inputOwnerRole.value = 'dueño';
    if (inputOwnerExp) inputOwnerExp.value = '12';
  }

  const savedShop = localStorage.getItem('taller_perfil_taller');
  if (savedShop) {
    const shop = JSON.parse(savedShop);
    if (inputShopName) inputShopName.value = shop.name || '';
    if (inputShopDesc) inputShopDesc.value = shop.desc || '';
    if (inputShopYear) inputShopYear.value = shop.year || '';
    if (inputShopArea) inputShopArea.value = shop.area || '';
  }

  formOwner.addEventListener('submit', (e) => {
    e.preventDefault();

    const ownerData = {
      name: inputOwnerName.value.trim(),
      role: inputOwnerRole.value.trim(),
      city: inputOwnerCity.value.trim(),
      exp: inputOwnerExp.value.trim()
    };

    localStorage.setItem('taller_perfil_dueno', JSON.stringify(ownerData));
    syncSidebarUser();
    alert('¡Datos del dueño guardados correctamente!');
  });

  formShop.addEventListener('submit', (e) => {
    e.preventDefault();

    const shopData = {
      name: inputShopName.value.trim(),
      desc: inputShopDesc.value.trim(),
      year: inputShopYear.value.trim(),
      area: inputShopArea.value.trim()
    };

    localStorage.setItem('taller_perfil_taller', JSON.stringify(shopData));
    syncSidebarUser();
    alert('¡Datos del taller guardados correctamente!');
  });
}

/* ===================================================
   6. MÓDULO CALCULADORA DE NUEVA COTIZACIÓN
   =================================================== */
function initQuoteCalculatorModule() {
  const selectMaterial = document.getElementById('quote-material-select');
  const qtyInput = document.getElementById('quote-material-qty');
  const btnAddItem = document.getElementById('btn-add-quote-item');
  const itemsBody = document.getElementById('quote-items-body');

  const hoursInput = document.getElementById('quote-hours');
  const hourRateInput = document.getElementById('quote-hour-rate');
  const wasteInput = document.getElementById('quote-waste-margin');
  const profitInput = document.getElementById('quote-profit-margin');

  const sumMatBase = document.getElementById('sum-materials-base');
  const sumWaste = document.getElementById('sum-waste');
  const sumMatTotal = document.getElementById('sum-materials-total');
  const sumLabor = document.getElementById('sum-labor');
  const sumProfit = document.getElementById('sum-profit');
  const sumGrandTotal = document.getElementById('sum-grand-total');

  const btnSaveProject = document.getElementById('btn-save-as-project');
  const btnReset = document.getElementById('btn-reset-quote');

  if (!selectMaterial || !itemsBody) return; // Si no estamos en cotizador-stock.html, salir

  let quoteItems = [];

  function formatARS(val) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(val);
  }

  // Cargar materiales del catálogo al selector
  function populateMaterialSelect() {
    const defaultMaterials = [
      { id: '1', nombre: 'Tubo estructural 40x40x1.6', precio: 28500 },
      { id: '2', nombre: 'Perfil ángulo 1" x 1/8"', precio: 14200 },
      { id: '3', nombre: 'Chapa lisa BWG 18 (1.2mm)', precio: 45000 }
    ];
    const raw = localStorage.getItem('taller_materiales_stock');
    const materials = raw ? JSON.parse(raw) : defaultMaterials;

    selectMaterial.innerHTML = '';
    materials.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.dataset.nombre = m.nombre;
      opt.dataset.precio = m.precio;
      opt.textContent = `${m.nombre} (${formatARS(m.precio)})`;
      selectMaterial.appendChild(opt);
    });
  }

  // Recalcular todos los subtotales y total general
  function recalculateQuote() {
    let matBase = 0;
    itemsBody.innerHTML = '';

    if (quoteItems.length === 0) {
      itemsBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-muted); padding: 1rem;">No hay materiales en el despiece.</td></tr>`;
    } else {
      quoteItems.forEach((item, index) => {
        const sub = item.qty * item.price;
        matBase += sub;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.nombre}</td>
          <td>${item.qty}</td>
          <td>${formatARS(item.price)}</td>
          <td>${formatARS(sub)}</td>
          <td class="text-center">
            <button type="button" class="btn-action" data-index="${index}" title="Quitar">❌</button>
          </td>
        `;

        tr.querySelector('.btn-action').addEventListener('click', () => {
          quoteItems.splice(index, 1);
          recalculateQuote();
        });

        itemsBody.appendChild(tr);
      });
    }

    const wastePct = (parseFloat(wasteInput?.value) || 0) / 100;
    const profitPct = (parseFloat(profitInput?.value) || 0) / 100;
    const hours = parseFloat(hoursInput?.value) || 0;
    const hourRate = parseFloat(hourRateInput?.value) || 0;

    const wasteVal = matBase * wastePct;
    const matTotal = matBase + wasteVal;
    const laborVal = hours * hourRate;
    const costSubtotal = matTotal + laborVal;
    const profitVal = costSubtotal * profitPct;
    const grandTotal = costSubtotal + profitVal;

    if (sumMatBase) sumMatBase.textContent = formatARS(matBase);
    if (sumWaste) sumWaste.textContent = formatARS(wasteVal);
    if (sumMatTotal) sumMatTotal.textContent = formatARS(matTotal);
    if (sumLabor) sumLabor.textContent = formatARS(laborVal);
    if (sumProfit) sumProfit.textContent = formatARS(profitVal);
    if (sumGrandTotal) {
      sumGrandTotal.textContent = formatARS(grandTotal);
      sumGrandTotal.dataset.rawTotal = grandTotal;
    }
  }

  // Agregar material al despiece
  btnAddItem.addEventListener('click', () => {
    const selected = selectMaterial.options[selectMaterial.selectedIndex];
    if (!selected) return;

    const nombre = selected.dataset.nombre;
    const price = parseFloat(selected.dataset.precio) || 0;
    const qty = parseFloat(qtyInput.value) || 1;

    quoteItems.push({ nombre, price, qty });
    qtyInput.value = '1';
    recalculateQuote();
  });

  // Eventos de inputs numéricos para recalcular al vuelo
  [hoursInput, hourRateInput, wasteInput, profitInput].forEach(inp => {
    if (inp) inp.addEventListener('input', recalculateQuote);
  });

  // Guardar como proyecto en 'Presupuestos'
  if (btnSaveProject) {
    btnSaveProject.addEventListener('click', () => {
      const projName = document.getElementById('quote-project-name')?.value.trim();
      const clientName = document.getElementById('quote-client-name')?.value.trim();
      const grandTotal = parseFloat(sumGrandTotal?.dataset.rawTotal) || 0;

      if (!projName || !clientName) {
        alert('Por favor completa el nombre de la obra y del cliente antes de guardar.');
        return;
      }

      if (quoteItems.length === 0) {
        alert('Agrega al menos un material al despiece para armar el presupuesto.');
        return;
      }

      const STORAGE_KEY = 'taller_proyectos';
      const raw = localStorage.getItem(STORAGE_KEY);
      const projects = raw ? JSON.parse(raw) : [];

      const newProject = {
        id: Date.now().toString(),
        name: projName,
        client: clientName,
        status: 'presupuestos',
        progress: 0,
        start: 'A definir',
        end: 'A definir',
        budget: Math.round(grandTotal)
      };

      projects.unshift(newProject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

      alert(`¡Presupuesto guardado con éxito! Se añadió "${projName}" a la sección de Proyectos (Presupuestos).`);
      
      // Limpiar formulario
      document.getElementById('quote-project-name').value = '';
      document.getElementById('quote-client-name').value = '';
      quoteItems = [];
      recalculateQuote();
    });
  }

  // Limpiar calculadora
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      quoteItems = [];
      document.getElementById('quote-project-name').value = '';
      document.getElementById('quote-client-name').value = '';
      recalculateQuote();
    });
  }

  populateMaterialSelect();
  recalculateQuote();
}