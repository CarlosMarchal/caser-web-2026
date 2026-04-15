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
  var form    = document.getElementById('calcularForm');
  var success = document.getElementById('successCard');

  // Validación básica
  var nombreEl    = document.getElementById('nombre');
  var apellidosEl = document.getElementById('apellidos');
  var emailEl     = document.getElementById('email');
  var telefonoEl  = document.getElementById('telefono');
  var aceptoTerminos = document.getElementById('aceptoTerminos');

  if (!nombreEl || !nombreEl.value.trim()) {
    showFieldError(nombreEl, 'Por favor, introduce tu nombre.');
    return;
  }
  if (!telefonoEl || !telefonoEl.value.trim()) {
    showFieldError(telefonoEl, 'Por favor, introduce tu teléfono.');
    return;
  }
  if (!aceptoTerminos || !aceptoTerminos.checked) {
    alert('Debes aceptar los términos y condiciones para continuar.');
    return;
  }

  var submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.textContent = 'Enviando...'; submitBtn.disabled = true; }

  // Limpiar teléfono (eliminar espacios)
  var cleanTel = telefonoEl.value.replace(/\s/g, '');
  if (!cleanTel.startsWith('+')) cleanTel = '+34' + cleanTel.replace(/\D/g, '');

  // Construir campos para HubSpot
  var fields = [
    { name: 'firstname',    value: nombreEl.value.trim() },
    { name: 'phone',        value: cleanTel },
    { name: 'tarificador',  value: '402' },
    { name: 'casilla_rgpd', value: 'true' }
  ];
  if (apellidosEl && apellidosEl.value.trim()) {
    fields.push({ name: 'lastname', value: apellidosEl.value.trim() });
  }
  if (emailEl && emailEl.value.trim()) {
    fields.push({ name: 'email', value: emailEl.value.trim() });
  }

  var payload = {
    fields: fields,
    context: { pageUri: window.location.href, pageName: document.title }
  };

  function showCalcSuccess() {
    if (form)    form.style.display = 'none';
    if (success) {
      success.style.display = 'block';
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function trackAndShow() {
    return caserTrack.generateLead(cleanTel, 'tarificador_402_calcular')
      .then(showCalcSuccess, showCalcSuccess);
  }

  // Envío a HubSpot
  if (HS_PORTAL_ID && HS_FORM_ID) {
    var url = 'https://api.hsforms.com/submissions/v3/integration/submit/' + HS_PORTAL_ID + '/' + HS_FORM_ID;
    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(trackAndShow, trackAndShow); // Mostrar éxito aunque falle la red
  } else {
    setTimeout(trackAndShow, 800);
  }
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


// ── UTILIDAD: formato teléfono 3+3+3 y validación 9 dígitos exactos ─────────

/**
 * Formatea un input de teléfono al vuelo: solo dígitos, máx 9, separados XXX XXX XXX
 * Uso: <input oninput="formatPhone(this)">
 */
function formatPhone(input) {
  var digits = input.value.replace(/\D/g, '').slice(0, 9);
  var parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 9));
  input.value = parts.join(' ');
}

/**
 * Valida que haya exactamente 9 dígitos y marca visualmente el campo si no.
 * Devuelve los 9 dígitos limpios, o null si inválido.
 */
function validatePhone(input) {
  var digits = (input ? input.value : '').replace(/\D/g, '');
  if (digits.length !== 9) {
    if (input) {
      input.style.borderColor = '#c9474a';
      input.focus();
      setTimeout(function () { input.style.borderColor = ''; }, 2500);
    }
    return null;
  }
  return digits;
}

// ---- MODAL DE LLAMADA ----

// ── HUBSPOT ──────────────────────────────────────────────────────────────────
var HS_PORTAL_ID = '6596944';
var HS_FORM_ID   = 'cd3fb712-acc6-42f7-8843-e42f1360c3c4';

// Tarificadores por origen:
//   400 → Modal "Te llamamos" (planes index.html)
//   401 → Hero form (index.html)
//   402 → Formulario calcular.html

var _currentPlanName = '';

function openCallModal(planName) {
  var modal = document.getElementById('callModal');
  if (!modal) return;
  _currentPlanName = planName || '';

  // Mostrar nombre del plan
  var planEl = document.getElementById('callModalPlanName');
  if (planEl) planEl.textContent = _currentPlanName;

  // Resetear estado del formulario
  var formWrap = modal.querySelector('.call-modal-form-wrap');
  var successWrap = document.getElementById('callModalSuccess');
  var submitBtn = modal.querySelector('.call-modal-submit');
  var phoneInput = document.getElementById('callModalPhone');
  if (formWrap)   formWrap.style.display = 'block';
  if (successWrap) successWrap.style.display = 'none';
  if (submitBtn)  { submitBtn.textContent = 'Te llamamos ahora'; submitBtn.disabled = false; }
  if (phoneInput) phoneInput.value = '';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Foco en el campo teléfono
  setTimeout(function () { if (phoneInput) phoneInput.focus(); }, 200);
}

function closeCallModal() {
  var modal = document.getElementById('callModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function submitCallModal() {
  var phoneInput = document.getElementById('callModalPhone');
  var terms      = document.getElementById('callModalTerms');
  var submitBtn  = document.querySelector('.call-modal-submit');

  // Validación: exactamente 9 dígitos
  var cleanPhone = validatePhone(phoneInput);
  if (!cleanPhone) return;
  if (terms && !terms.checked) {
    alert('Debes aceptar los términos y condiciones para continuar.');
    return;
  }

  // Estado de carga
  if (submitBtn) { submitBtn.textContent = 'Enviando...'; submitBtn.disabled = true; }

  // Construir datos para HubSpot
  var fields = [
    { name: 'phone',        value: '+34' + cleanPhone },
    { name: 'tarificador',  value: '400' },
    { name: 'casilla_rgpd', value: 'true' }
  ];
  if (_currentPlanName) {
    fields.push({ name: 'plan_de_interes', value: _currentPlanName });
  }

  var payload = {
    fields: fields,
    context: {
      pageUri:  window.location.href,
      pageName: document.title
    }
  };

  function trackAndShow() {
    return caserTrack.generateLead('+34' + cleanPhone, 'tarificador_400_modal_planes')
      .then(showCallModalSuccess, showCallModalSuccess);
  }

  // Envío a HubSpot
  if (HS_PORTAL_ID && HS_FORM_ID) {
    var url = 'https://api.hsforms.com/submissions/v3/integration/submit/' + HS_PORTAL_ID + '/' + HS_FORM_ID;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(trackAndShow, trackAndShow);
  } else {
    // Sin HubSpot configurado → mostrar éxito igualmente
    setTimeout(trackAndShow, 800);
  }
}

function showCallModalSuccess() {
  var formWrap    = document.querySelector('.call-modal-form-wrap');
  var successWrap = document.getElementById('callModalSuccess');
  if (formWrap)   formWrap.style.display = 'none';
  if (successWrap) successWrap.style.display = 'block';
}

// ---- FORMULARIO DEL HERO (envío directo, sin modal) ----

function submitHeroForm() {
  var phoneInput = document.getElementById('heroPhone');
  var termsInput = document.getElementById('heroTerms');
  var submitBtn  = document.querySelector('#heroFormWrap .hf-submit');

  // Validación: exactamente 9 dígitos
  var cleanPhone = validatePhone(phoneInput);
  if (!cleanPhone) return;
  if (termsInput && !termsInput.checked) {
    alert('Por favor, acepta los términos y condiciones para continuar.');
    return;
  }
  if (submitBtn) { submitBtn.textContent = 'Enviando...'; submitBtn.disabled = true; }

  var fields = [
    { name: 'phone',        value: '+34' + cleanPhone },
    { name: 'tarificador',  value: '401' },
    { name: 'casilla_rgpd', value: 'true' }
  ];
  var payload = {
    fields: fields,
    context: { pageUri: window.location.href, pageName: document.title }
  };

  function showHeroSuccess() {
    var wrap    = document.getElementById('heroFormWrap');
    var success = document.getElementById('heroFormSuccess');
    if (wrap)    wrap.style.display = 'none';
    if (success) success.style.display = 'block';
  }

  function trackAndShow() {
    return caserTrack.generateLead('+34' + cleanPhone, 'tarificador_401_hero')
      .then(showHeroSuccess, showHeroSuccess);
  }

  if (HS_PORTAL_ID && HS_FORM_ID) {
    var url = 'https://api.hsforms.com/submissions/v3/integration/submit/' + HS_PORTAL_ID + '/' + HS_FORM_ID;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(trackAndShow, trackAndShow);
  } else {
    setTimeout(trackAndShow, 800);
  }
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

// ============================================================
// MODAL AVISO LEGAL / POLÍTICA DE PRIVACIDAD
// ============================================================
function openLegalModal() {
  var overlay = document.getElementById('legalModal');
  if (!overlay) return;
  overlay.classList.add('active');
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeLegalModal() {
  var overlay = document.getElementById('legalModal');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
  var legalOverlay = document.getElementById('legalModal');
  if (legalOverlay) {
    legalOverlay.addEventListener('click', function (e) {
      if (e.target === legalOverlay) closeLegalModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLegalModal();
  });
});

// ============================================================
// GTM / DATALAYER TRACKING — caserTrack
// Replica del patrón Adeslas/Asisa (src/lib/tracking.ts)
// Consent gestionado externamente vía GTM (Consentiam.eu).
// ============================================================
window.caserTrack = (function () {
  function pushEvent(event, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, params || {}));
  }

  async function sha256(value) {
    var normalized = String(value).replace(/\s/g, '').toLowerCase();
    var encoded = new TextEncoder().encode(normalized);
    var buffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  async function generateLead(phone, source) {
    try {
      var hashedPhone = await sha256(phone);
      pushEvent('generate_lead', {
        lead_source: source,
        user_data: { sha256_phone_number: hashedPhone }
      });
    } catch (err) {
      console.warn('[caserTrack] SHA-256 no disponible:', err);
      pushEvent('generate_lead', { lead_source: source });
    }
  }

  function clickToCallContratacion(location) {
    pushEvent('click_to_call_contratacion', {
      phone_number: '910052270',
      click_location: location
    });
  }

  function clickToCallAsistencia(location) {
    pushEvent('click_to_call_asistencia', {
      phone_number: '911553472',
      click_location: location
    });
  }

  return {
    generateLead: generateLead,
    clickToCallContratacion: clickToCallContratacion,
    clickToCallAsistencia: clickToCallAsistencia
  };
})();

// ============================================================
// CLICK-TO-CALL TRACKING — delegación global en a[href^="tel:"]
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  function detectLocation(anchor) {
    if (anchor.closest('.site-header'))   return 'header';
    if (anchor.closest('.main-nav'))      return 'nav';
    if (anchor.closest('.mobile-cta'))    return 'mobile_cta';
    if (anchor.closest('.site-footer'))   return 'footer';
    if (anchor.closest('.legal-page'))    return 'legal';
    if (anchor.closest('.success-card'))  return 'success';
    return 'body';
  }

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!anchor) return;
    var digits = anchor.getAttribute('href').replace(/^tel:/, '').replace(/\D/g, '');
    var location = detectLocation(anchor);
    if (digits === '910052270') {
      caserTrack.clickToCallContratacion(location);
    } else if (digits === '911553472') {
      caserTrack.clickToCallAsistencia(location);
    }
  }, true);
});
