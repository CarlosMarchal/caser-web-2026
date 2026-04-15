# GTM + DataLayer Caser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar GTM (`GTM-MCS2XJCK`) en las 9 páginas HTML de Caser y emitir desde vanilla JS los eventos `generate_lead`, `click_to_call_contratacion` y `click_to_call_asistencia` (con teléfono SHA-256), replicando 1:1 el patrón de Adeslas/Asisa.

**Architecture:** Snippet GTM al final de `<head>` (después del eventual script de Consentiam) + `<noscript>` al inicio de `<body>`. Módulo vanilla `window.caserTrack` añadido al `js/main.js` existente, cableado en los 3 formularios HubSpot (`submitForm`, `submitCallModal`, `submitHeroForm`) y en un listener delegado para todos los `a[href^="tel:"]`.

**Tech Stack:** HTML5 estático, JS ES2017 (vanilla, sin bundler), Web Crypto API (`crypto.subtle.digest`).

**Spec:** `docs/superpowers/specs/2026-04-16-gtm-datalayer-design.md`

> **Nota sobre testing:** este repo es HTML estático sin runner de tests. La verificación es manual con DevTools y GTM Preview Mode (Task 7). No introducimos framework de tests por YAGNI.

---

## Mapa de archivos

- **Modificar** `js/main.js` — añadir módulo `caserTrack`, cablear `generateLead` en los 3 `submit*`, añadir delegación `tel:`.
- **Modificar** las 9 HTML para insertar GTM `<head>` + `<noscript>`:
  - `index.html`, `particulares.html`, `familiar.html`, `mayores.html`, `embarazo.html`, `autonomos.html`, `calcular.html`, `legal.html`, `avisolegal-poliiticadeprivacidad/index.html`
- **Modificar** `legal.html` y `avisolegal-poliiticadeprivacidad/index.html` para incluir `js/main.js` (hoy no lo cargan; sin él no hay tracking de `tel:`).

---

## Task 1: Añadir módulo `caserTrack` a `js/main.js`

**Files:**
- Modify: `js/main.js` (insertar bloque al final, antes del último cierre de archivo)

- [ ] **Step 1: Insertar el módulo al final de `js/main.js`**

Edit final del archivo `js/main.js` añadiendo este bloque tras la última función existente (`closeLegalModal` y su listener `DOMContentLoaded`):

```js
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
      // Navegador sin Web Crypto: emitimos sin user_data para no perder la conversión.
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
```

- [ ] **Step 2: Verificar carga del módulo**

Abrir `index.html` en navegador y en consola DevTools ejecutar:

```js
typeof window.caserTrack.generateLead
```

Esperado: `"function"`.

- [ ] **Step 3: Verificar SHA-256**

En consola DevTools:

```js
caserTrack.generateLead('600 123 456', 'manual_test').then(() => console.log(dataLayer[dataLayer.length-1]));
```

Esperado: objeto con `event: "generate_lead"`, `lead_source: "manual_test"`, y `user_data.sha256_phone_number` con 64 hex chars (debe ser determinista para `+34600123456` normalizado a `600123456`).

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat(tracking): add caserTrack module for GTM dataLayer events"
```

---

## Task 2: Cablear `generateLead` en `submitForm` (calcular.html)

**Files:**
- Modify: `js/main.js:121-193` (función `submitForm`)

- [ ] **Step 1: Localizar la función `submitForm`**

Está en `js/main.js` líneas 121-193. La parte relevante es el bloque del `fetch` (líneas 181-192).

- [ ] **Step 2: Reemplazar el bloque del fetch para invocar `caserTrack.generateLead`**

Edit en `js/main.js`. Reemplazar:

```js
  // Envío a HubSpot
  if (HS_PORTAL_ID && HS_FORM_ID) {
    var url = 'https://api.hsforms.com/submissions/v3/integration/submit/' + HS_PORTAL_ID + '/' + HS_FORM_ID;
    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function () { showCalcSuccess(); })
    .catch(function () { showCalcSuccess(); }); // Mostrar éxito aunque falle la red
  } else {
    setTimeout(showCalcSuccess, 800);
  }
}
```

por:

```js
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
```

- [ ] **Step 3: Verificar manualmente en `calcular.html`**

Abrir `calcular.html` en navegador local. Rellenar el formulario con teléfono `600 123 456` y enviar. En consola DevTools:

```js
dataLayer.filter(e => e.event === 'generate_lead')
```

Esperado: al menos 1 entrada con `lead_source: "tarificador_402_calcular"` y `user_data.sha256_phone_number` (64 hex).

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat(tracking): emit generate_lead from calcular form"
```

---

## Task 3: Cablear `generateLead` en `submitCallModal` (modal planes index)

**Files:**
- Modify: `js/main.js:315-366` (función `submitCallModal`)

- [ ] **Step 1: Reemplazar el bloque del fetch en `submitCallModal`**

Edit en `js/main.js`. Reemplazar:

```js
  // Envío a HubSpot
  if (HS_PORTAL_ID && HS_FORM_ID) {
    var url = 'https://api.hsforms.com/submissions/v3/integration/submit/' + HS_PORTAL_ID + '/' + HS_FORM_ID;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (res.ok) { showCallModalSuccess(); }
      else         { showCallModalSuccess(); } // Mostrar éxito aunque haya error (no bloqueamos al usuario)
    })
    .catch(function () { showCallModalSuccess(); });
  } else {
    // Sin HubSpot configurado → mostrar éxito igualmente
    setTimeout(showCallModalSuccess, 800);
  }
}
```

por:

```js
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
```

- [ ] **Step 2: Verificar en navegador**

Abrir `index.html`, click en cualquier "Te llamamos" de un plan, rellenar `600 123 456`, marcar términos, enviar. En consola:

```js
dataLayer.filter(e => e.event === 'generate_lead' && e.lead_source === 'tarificador_400_modal_planes')
```

Esperado: 1 entrada con `user_data.sha256_phone_number`.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat(tracking): emit generate_lead from call modal"
```

---

## Task 4: Cablear `generateLead` en `submitHeroForm` (hero index)

**Files:**
- Modify: `js/main.js:377-416` (función `submitHeroForm`)

- [ ] **Step 1: Reemplazar el bloque del fetch en `submitHeroForm`**

Edit en `js/main.js`. Reemplazar:

```js
  if (HS_PORTAL_ID && HS_FORM_ID) {
    var url = 'https://api.hsforms.com/submissions/v3/integration/submit/' + HS_PORTAL_ID + '/' + HS_FORM_ID;
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function () { showHeroSuccess(); })
      .catch(function () { showHeroSuccess(); });
  } else {
    setTimeout(showHeroSuccess, 800);
  }
}
```

por:

```js
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
```

- [ ] **Step 2: Verificar en navegador**

Abrir `index.html`, en el formulario hero introducir `600 123 456`, marcar términos, enviar. En consola:

```js
dataLayer.filter(e => e.event === 'generate_lead' && e.lead_source === 'tarificador_401_hero')
```

Esperado: 1 entrada con `user_data.sha256_phone_number`.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat(tracking): emit generate_lead from hero form"
```

---

## Task 5: Listener delegado para enlaces `tel:` (click_to_call_*)

**Files:**
- Modify: `js/main.js` (añadir bloque al final del archivo)

- [ ] **Step 1: Añadir listener delegado al final de `js/main.js`**

Edit. Insertar al final del fichero:

```js
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
    // Otros números: no se trackea. NO hacemos preventDefault: el tel: debe seguir abriendo el marcador.
  }, true);
});
```

- [ ] **Step 2: Verificar manualmente**

Abrir `index.html`, click en el `tel:910052270` del header. En consola:

```js
dataLayer.filter(e => e.event === 'click_to_call_contratacion')
```

Esperado: entrada con `phone_number: "910052270"` y `click_location: "header"`.

Repetir click en el `tel:911553472`. Esperado entrada con `event: "click_to_call_asistencia"`, `click_location: "header"`.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat(tracking): emit click_to_call events for tel: links"
```

---

## Task 6: Insertar snippet GTM en las 9 HTML

Repetir el mismo cambio en cada archivo. Anchor: justo antes de `</head>` para el `<script>`, justo después de `<body>` para el `<noscript>`.

**Files:**
- Modify: `index.html`, `particulares.html`, `familiar.html`, `mayores.html`, `embarazo.html`, `autonomos.html`, `calcular.html`, `legal.html`, `avisolegal-poliiticadeprivacidad/index.html`

### 6.1 `index.html`

- [ ] **Step 1: Insertar snippet GTM antes de `</head>` (línea 11)**

Edit `index.html`. Reemplazar:

```html
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
```

por:

```html
  <link rel="stylesheet" href="css/styles.css">
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-MCS2XJCK');</script>
  <!-- End Google Tag Manager -->
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MCS2XJCK"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
```

### 6.2 `particulares.html`

- [ ] **Step 1: Aplicar exactamente el mismo reemplazo que en 6.1**

Edit `particulares.html` con el mismo bloque (mismo `</head>` precedido por `<link rel="stylesheet" href="css/styles.css">` y `<body>` siguiente).

### 6.3 `familiar.html`

- [ ] **Step 1: Aplicar el mismo reemplazo de 6.1**

### 6.4 `mayores.html`

- [ ] **Step 1: Aplicar el mismo reemplazo de 6.1**

### 6.5 `embarazo.html`

- [ ] **Step 1: Aplicar el mismo reemplazo de 6.1**

### 6.6 `autonomos.html`

- [ ] **Step 1: Aplicar el mismo reemplazo de 6.1**

### 6.7 `calcular.html`

- [ ] **Step 1: Aplicar el mismo reemplazo de 6.1**

> Nota: el `</head>` está en línea ~197 y va precedido por más contenido (estilos inline, schema, etc.). Localizar el último `</head>` y el `<body>` siguiente para hacer el reemplazo análogo al de 6.1.

### 6.8 `legal.html`

- [ ] **Step 1: Insertar GTM antes de `</head>` (línea 81) y noscript tras `<body>` (línea 82)**

Edit `legal.html`. El `</head>` va precedido por un `<style>` inline. Localizar `</head>` y `<body>` y aplicar el mismo bloque que en 6.1.

### 6.9 `avisolegal-poliiticadeprivacidad/index.html`

- [ ] **Step 1: Insertar GTM antes de `</head>` (línea 81) y noscript tras `<body>` (línea 82)**

Edit `avisolegal-poliiticadeprivacidad/index.html` con el mismo bloque.

### 6.10 Verificación global del snippet

- [ ] **Step 1: Comprobar que GTM está en las 9 páginas**

```bash
grep -l "GTM-MCS2XJCK" *.html avisolegal-poliiticadeprivacidad/*.html | wc -l
```

Esperado: `9`.

- [ ] **Step 2: Verificar carga real en navegador**

Abrir `index.html` y en consola:

```js
window.dataLayer && window.dataLayer[0]
```

Esperado: `{ "gtm.start": <timestamp>, event: "gtm.js" }`.

En la pestaña Network filtrar por `googletagmanager.com/gtm.js?id=GTM-MCS2XJCK` → debe aparecer con status 200.

- [ ] **Step 3: Commit**

```bash
git add index.html particulares.html familiar.html mayores.html embarazo.html autonomos.html calcular.html legal.html avisolegal-poliiticadeprivacidad/index.html
git commit -m "feat(gtm): install GTM-MCS2XJCK on all 9 HTML pages"
```

---

## Task 7: Incluir `js/main.js` en `legal.html` y `avisolegal-poliiticadeprivacidad/index.html`

Estas dos páginas no cargan `main.js` y por tanto sin este cambio no trackean clicks `tel:` ni reciben `caserTrack`.

**Files:**
- Modify: `legal.html` (insertar `<script>` antes de `</body>` línea 264)
- Modify: `avisolegal-poliiticadeprivacidad/index.html` (insertar `<script>` antes de `</body>` línea 261)

- [ ] **Step 1: `legal.html` — añadir `<script src="js/main.js">` antes de `</body>`**

Edit `legal.html`. Reemplazar:

```html
</body>
</html>
```

por:

```html
  <script src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: `avisolegal-poliiticadeprivacidad/index.html` — añadir `<script src="../js/main.js">` antes de `</body>`**

> Atención al path relativo: esta página vive en subcarpeta, así que usa `../js/main.js` (igual que `../css/styles.css` línea 11).

Edit `avisolegal-poliiticadeprivacidad/index.html`. Reemplazar:

```html
</body>
</html>
```

por:

```html
  <script src="../js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verificar**

Abrir `legal.html` y `avisolegal-poliiticadeprivacidad/index.html` en navegador. En consola:

```js
typeof window.caserTrack
```

Esperado: `"object"` en ambas.

Click en cualquier `tel:910052270` de la página y comprobar:

```js
dataLayer.filter(e => e.event === 'click_to_call_contratacion')
```

Esperado: entrada con `click_location: "legal"` (porque las páginas usan la clase `.legal-page` detectada por `detectLocation`).

- [ ] **Step 4: Commit**

```bash
git add legal.html avisolegal-poliiticadeprivacidad/index.html
git commit -m "feat(tracking): include main.js on legal pages for tel: tracking"
```

---

## Task 8: Verificación end-to-end con GTM Preview Mode

- [ ] **Step 1: Habilitar Preview Mode en GTM**

En el contenedor `GTM-MCS2XJCK`, click "Preview", introducir la URL local servida (p.ej. `http://localhost:8000/` si se usa `python -m http.server`). Confirmar que Tag Assistant se conecta.

- [ ] **Step 2: Recorrer cada flujo y confirmar eventos en Tag Assistant**

| Acción                                                  | Evento esperado                  | Variables clave                                                     |
|---------------------------------------------------------|----------------------------------|---------------------------------------------------------------------|
| Carga inicial                                           | `gtm.js`, `gtm.dom`, `gtm.load` | —                                                                   |
| Click `tel:910052270` en header                         | `click_to_call_contratacion`     | `phone_number=910052270`, `click_location=header`                   |
| Click `tel:911553472` en header                         | `click_to_call_asistencia`       | `phone_number=911553472`, `click_location=header`                   |
| Click `tel:910052270` en footer                         | `click_to_call_contratacion`     | `click_location=footer`                                             |
| Click CTA móvil (`tel:`)                                | `click_to_call_contratacion`     | `click_location=mobile_cta`                                         |
| Submit hero form (index)                                | `generate_lead`                  | `lead_source=tarificador_401_hero`, `user_data.sha256_phone_number` |
| Submit modal "Te llamamos" (index)                      | `generate_lead`                  | `lead_source=tarificador_400_modal_planes`                          |
| Submit `calcular.html`                                  | `generate_lead`                  | `lead_source=tarificador_402_calcular`                              |

- [ ] **Step 3: Confirmar también en pestaña Network**

Para cada `generate_lead`, comprobar que GA4 envía un hit a `https://www.google-analytics.com/g/collect` con `en=generate_lead`. (Solo si la tag GA4 ya está configurada en GTM; si no, basta con que el evento llegue a Tag Assistant.)

- [ ] **Step 4: Commit nada (solo verificación)**

Si todo OK, no hay nada que commitear. Documentar resultado en el PR/issue correspondiente.

---

## Self-review

- ✅ Spec coverage: GTM snippet (Task 6), módulo tracking (Task 1), 3 forms cableados (Tasks 2-4), tel: delegation (Task 5), legal pages incluyen main.js (Task 7), verificación (Tasks 1-7 individuales + 8 e2e).
- ✅ Sin placeholders: todos los reemplazos llevan código completo.
- ✅ Consistencia de tipos: `caserTrack.generateLead/clickToCallContratacion/clickToCallAsistencia` se usan con la misma firma en Task 1 (definición), Tasks 2-4 (forms) y Task 5 (tel:).
- ✅ Decisión sobre Consentiam: el snippet GTM va al final de `<head>` (justo antes de `</head>`), de modo que cualquier futuro `<script>` de Consentiam insertado más arriba se ejecute primero — cumple la regla del spec sin requerir el script de consent ya presente.
