/* ============================================================
   CASER SEGUROS DE SALUD - JavaScript Principal
   ============================================================ */

// ---- MENÚ MÓVIL ----
function toggleNav() {
  const nav = document.getElementById('mainNav');
  const btn = document.querySelector('.nav-toggle');
  if (nav) {
    nav.classList.toggle('open');
    btn.textContent = nav.classList.contains('open') ? '✕' : '☰';
    btn.setAttribute('aria-label', nav.classList.contains('open') ? 'Cerrar menú' : 'Abrir menú');
  }
}

// Cerrar menú al hacer click en un enlace (móvil)
document.addEventListener('DOMContentLoaded', function () {
  const navLinks = document.querySelectorAll('.nav-inner a');
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const nav = document.getElementById('mainNav');
      const btn = document.querySelector('.nav-toggle');
      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        if (btn) btn.textContent = '☰';
      }
    });
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', function (e) {
    const nav = document.getElementById('mainNav');
    const btn = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (nav && nav.classList.contains('open') && mainNav && !mainNav.contains(e.target)) {
      nav.classList.remove('open');
      if (btn) btn.textContent = '☰';
    }
  });
});


// ---- FAQ ACORDEÓN ----
function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  // Cerrar todos primero
  document.querySelectorAll('.faq-item').forEach(function (el) {
    el.classList.remove('open');
  });
  // Si no estaba abierto, abrirlo
  if (!isOpen) {
    item.classList.add('open');
  }
}


// ---- AÑADIR ASEGURADOS (página calcular) ----
var aseguradoCount = 1;

function addAsegurado() {
  if (aseguradoCount >= 6) {
    alert('Puedes añadir un máximo de 6 asegurados en el formulario online. Para más asegurados, llámanos al 91 005 22 70.');
    return;
  }
  aseguradoCount++;
  var container = document.getElementById('asegurados-container');
  if (!container) return;

  var block = document.createElement('div');
  block.className = 'asegurado-block';
  block.id = 'asegurado-' + aseguradoCount;
  block.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeAsegurado(this)" title="Eliminar asegurado">✕</button>
    <p style="font-size:13px; font-weight:700; color:var(--color-primary); margin-bottom:14px;">Asegurado ${aseguradoCount}</p>
    <div class="form-row">
      <div class="form-group">
        <label>Fecha de nacimiento</label>
        <input type="date" name="nacimiento_${aseguradoCount}">
      </div>
      <div class="form-group">
        <label>Sexo</label>
        <select name="sexo_${aseguradoCount}">
          <option value="">-- Selecciona --</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </div>
    </div>
  `;
  container.appendChild(block);

  // Actualizar mensaje de descuento
  updateDescuentoMsg();

  // Scroll suave al nuevo bloque
  block.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeAsegurado(btn) {
  var block = btn.closest('.asegurado-block');
  if (block) {
    block.remove();
    aseguradoCount = Math.max(1, aseguradoCount - 1);
    updateDescuentoMsg();
  }
}

function updateDescuentoMsg() {
  var addBtn = document.querySelector('.add-asegurado-btn');
  if (!addBtn) return;
  var total = document.querySelectorAll('.asegurado-block').length;
  if (total >= 2) {
    addBtn.textContent = '+ Añadir otro asegurado (' + total + ' asegurados = hasta 10% dto. adicional)';
  } else {
    addBtn.textContent = '+ Añadir otro asegurado (hasta 10% de descuento adicional)';
  }
}


// ---- FORMULARIO CALCULAR (submit) ----
function submitForm(e) {
  e.preventDefault();
  var form = document.getElementById('calcularForm');
  var success = document.getElementById('successCard');

  // Validación básica
  var nombre = document.getElementById('nombre');
  var telefono = document.getElementById('telefono');
  var aceptoTerminos = document.getElementById('aceptoTerminos');

  if (!nombre || !nombre.value.trim()) {
    showFieldError(nombre, 'Por favor, introduce tu nombre.');
    return;
  }
  if (!telefono || !telefono.value.trim()) {
    showFieldError(telefono, 'Por favor, introduce tu teléfono.');
    return;
  }
  if (!aceptoTerminos || !aceptoTerminos.checked) {
    alert('Debes aceptar los términos y condiciones para continuar.');
    return;
  }

  // Simular envío
  var submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
  }

  setTimeout(function () {
    if (form) form.style.display = 'none';
    if (success) {
      success.style.display = 'block';
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 1200);
}

function showFieldError(field, msg) {
  if (!field) return;
  field.style.borderColor = 'var(--color-cross)';
  field.focus();
  var existing = field.parentNode.querySelector('.field-error');
  if (!existing) {
    var err = document.createElement('p');
    err.className = 'field-error';
    err.style.cssText = 'color:var(--color-cross);font-size:12px;margin-top:4px;';
    err.textContent = msg;
    field.parentNode.appendChild(err);
  }
  field.addEventListener('input', function () {
    field.style.borderColor = '';
    var errEl = field.parentNode.querySelector('.field-error');
    if (errEl) errEl.remove();
  }, { once: true });
}


// ---- ANIMACIONES AL SCROLL ----
document.addEventListener('DOMContentLoaded', function () {
  // Intersection Observer para animar cards al entrar en viewport
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  var animatables = document.querySelectorAll('.feature-card, .product-card, .plan-card, .testimonial-card, .cobertura-card, .ventaja-item');
  animatables.forEach(function (el, i) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease ' + (i * 0.07) + 's, transform 0.5s ease ' + (i * 0.07) + 's';
    observer.observe(el);
  });
});


// ---- MODAL DE LLAMADA ----
function openCallModal(planName) {
  var modal = document.getElementById('callModal');
  var planEl = document.getElementById('callModalPlanName');
  if (!modal) return;
  if (planEl) planEl.textContent = planName || '';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCallModal() {
  var modal = document.getElementById('callModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
  var overlay = document.getElementById('callModal');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCallModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCallModal();
  });
});


// ---- SMOOTH SCROLL para anclas ----
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
