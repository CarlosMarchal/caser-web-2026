# GTM + DataLayer para Caser Web 2026

**Fecha:** 2026-04-16
**Autor:** Juan Carlos Díaz — Convertiam.com
**GTM ID:** `GTM-MCS2XJCK`

## Objetivo

Replicar el patrón de medición ya implementado en los proyectos `Adeslasweb2026` y `web-asisa-2026` (React/Vite) sobre la web `caser-web-2026` (HTML estático + vanilla JS), de modo que GTM reciba el mismo conjunto de eventos del dataLayer y se puedan cablear las mismas etiquetas/conversiones (incluyendo *enhanced conversions* con teléfono hasheado SHA-256) sin reescribir el stack.

## Ámbito

Páginas afectadas (9 HTML):

- `index.html`
- `particulares.html`
- `familiar.html`
- `mayores.html`
- `embarazo.html`
- `autonomos.html`
- `calcular.html`
- `legal.html`
- `avisolegal-poliiticadeprivacidad/index.html`

Archivo JS único: `js/main.js`.

## Arquitectura

### 1. Snippet de Google Tag Manager

En cada HTML, dentro de `<head>` (lo más arriba posible, antes de cualquier `<script>` propio):

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MCS2XJCK');</script>
<!-- End Google Tag Manager -->
```

Justo después de `<body>`:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MCS2XJCK"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

> Consent gestionado externamente vía GTM (Consentiam.eu), igual que en Adeslas/Asisa. Esta capa no decide consentimiento. YA implementado via script directo el GTM siempre debajo de script de Consentiam.eu

### 2. Módulo de tracking en `js/main.js`

Vanilla, expuesto como `window.caserTrack` para uso desde HTML inline y desde el propio `main.js`. Estructura:

```js
window.caserTrack = (function () {
  function pushEvent(event, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, params || {}));
  }

  async function sha256(value) {
    const normalized = String(value).replace(/\s/g, '').toLowerCase();
    const encoded = new TextEncoder().encode(normalized);
    const buffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  async function generateLead(phone, source) {
    const hashedPhone = await sha256(phone);
    pushEvent('generate_lead', {
      lead_source: source,
      user_data: { sha256_phone_number: hashedPhone }
    });
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

> No emitimos `page_view` manual: la web es multipágina (no SPA), GTM ya dispara `gtm.js` por carga y la etiqueta de GA4 dispara su `page_view` nativo.

### 3. Cableado en formularios HubSpot existentes

Los tres `submit*` del fichero `js/main.js` ya envían a HubSpot. Tras la promesa del `fetch` (en `then` *y* en `catch`, igual que el código actual sigue mostrando éxito) se invoca `caserTrack.generateLead`:

| Función              | `lead_source`                  | Tarificador |
|----------------------|--------------------------------|-------------|
| `submitForm`         | `tarificador_402_calcular`     | 402         |
| `submitCallModal`    | `tarificador_400_modal_planes` | 400         |
| `submitHeroForm`     | `tarificador_401_hero`         | 401         |

Se hace `await caserTrack.generateLead(...)` *antes* de mostrar el éxito visual. Si el SHA-256 fallara (navegador antiguo sin `crypto.subtle`), se captura y se sigue mostrando éxito — la medición no debe bloquear la UX.

### 4. Cableado en enlaces telefónicos

En `DOMContentLoaded` se añade un listener delegado en `document` para `a[href^="tel:"]`:

- Se extrae el número limpio: `href.replace(/^tel:/, '').replace(/\D/g, '')`.
- Si es `910052270` → `clickToCallContratacion(location)`.
- Si es `911553472` → `clickToCallAsistencia(location)`.
- `location` se calcula a partir del contexto del enlace: `'header'`, `'footer'`, `'mobile_cta'`, `'body'`, etc., usando el ancestro más cercano con `class` reconocible (`.main-nav`, `.mobile-cta`, `.site-footer`, etc.). Si no se detecta, se usa `'body'`.

## Flujo de datos

```
Usuario rellena form ─► submit*() ─► HubSpot fetch
                                       └─► caserTrack.generateLead(phone, source)
                                            └─► sha256(phone)
                                                 └─► dataLayer.push({ event: 'generate_lead', ... })
                                                       └─► GTM ─► GA4 / Ads / Meta / etc.

Usuario hace click en tel: ─► listener delegado ─► caserTrack.clickToCall*(location)
                                                    └─► dataLayer.push({ event: 'click_to_call_*', ... })
```

## Manejo de errores

- `crypto.subtle.digest` no disponible → `try/catch` interno en `generateLead` que loggea en `console.warn` y **no** rompe el flujo. La conversión llega sin `user_data`.
- `dataLayer` ya inicializado por el snippet GTM antes de cualquier push del usuario.
- El listener delegado de `tel:` no hace `preventDefault`: el `tel:` debe seguir abriendo el marcador del dispositivo.

## Verificación

- Cargar cada página y comprobar en consola `window.dataLayer[0]` → `{ 'gtm.start': ..., event: 'gtm.js' }`.
- Enviar cada uno de los 3 formularios y comprobar push de `generate_lead` con el `lead_source` correcto y `sha256_phone_number` (64 hex chars).
- Click en cada `tel:` y comprobar push del evento correspondiente.
- En GTM Preview Mode: confirmar que los 3 eventos llegan y disparan las tags configuradas.

## Fuera de alcance

- No tocamos las tags/triggers dentro de GTM (eso lo hace el equipo de medición).
- No añadimos consent banner: lo gestiona Consentiam.eu vía GTM.
- No cambiamos nada del flujo HubSpot ni de la UI.
