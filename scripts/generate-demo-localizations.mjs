/*
 * Generates localized demo pages (es/demo.html, pt/demo.html) from the
 * English source demo.html.
 *

 * Usage:  node scripts/generate-demo-localizations.mjs
 *
 * Phases:
 *   1. Visible-text + meta translation (longest phrases first)
 *   2. Per-language URL canonicalisation (lang attr, canonical, og:url, ld+json url)
 *   3. Relative-path prefixing so assets/links resolve from /es and /pt subdirs
 *      (../css/style.css, ../index.html, ...) plus active-link fixes.
 *
 * NOTE: "Payroll & Compliance" is authored as "Payroll &amp; Compliance" in the
 * markup, so the translation keys carry the entity literally.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const enSource = readFileSync(resolve(root, 'demo.html'), 'utf8');

const dictionaries = {
  es: [
    // page metadata / SEO
    ['Live Demo \u2014 Every Chegatta Operating Model, Ready to Try', 'Demo en vivo \u2014 Todo modelo de trabajo de Chegatta, listo para probar'],
    ['Explore every Chegatta operating model on a real, preloaded account. Staffing agencies, multi-site restaurants, construction projects, external managers and more \u2014 copy a test email and log in. No sign-up.', 'Explora todos los modelos de trabajo de Chegatta en una cuenta real precargada. Agencias de trabajo, restaurantes multi-sitio, proyectos de construcci\u00f3n, responsables externos y m\u00e1s \u2014 copia un email de prueba e inicia sesi\u00f3n. Sin registro.'],
    ['Six real, preloaded demo accounts. Staffing agencies, multi-site restaurant, construction, external managers and more. Copy the login and explore.', 'Seis cuentas de demo real y precargadas. Agencias de trabajo, restaurantes multi-sitio, construcci\u00f3n, responsables externos y m\u00e1s. Copia el acceso y explora.'],
    ['Six real, preloaded demo accounts. Copy the login and explore Chegatta today.', 'Seis cuentas de demo real y precargadas. Copia el acceso y explora Chegatta hoy.'],
    ['Chegatta Live Demo', 'Demo en vivo de Chegatta'],
    ['Try every Chegatta operating model on a real, preloaded account. Test credentials included \u2014 just copy and log in, no sign-up.', 'Prueba todos los modelos de trabajo de Chegatta en una cuenta real precargada. Incluye credenciales de prueba: copia y entra, sin registro.'],
    // navigation
    ['Home', 'Inicio'],
    ['Features', 'Funciones'],
    ['How It Works', 'C\u00f3mo funciona'],
    ['Pricing', 'Precios'],
    ['Solutions', 'Soluciones'],
    ['FAQ', 'Preguntas frecuentes'],
    ['Get Started', 'Empezar prueba'],
    ['Clock-In App', 'App de Fichaje'],
    ['Kiosk Time Clock', 'Reloj de kiosco'],
    ['Payroll &amp; Compliance', 'N\u00f3mina y cumplimiento'],
    ['HR Platform', 'Plataforma de RR HH'],
    ['Use Cases', 'Casos de uso'],
    ['Compare plans', 'Comparar planes'],
    // footer
    ['Attendance, simplified.', 'Asistencia, simplificada.'],
    ['Product', 'Producto'],
    ['Company', 'Empresa'],
    ['About', 'Sobre nosotros'],
    ['Careers', 'Carreras'],
    ['Contact', 'Contacto'],
    ['Blog', 'Blog'],
    ['Login', 'Acceso'],
    // hero
    ['Live demo', 'Demo en vivo'],
    ['Every way Chegatta is used, ready to try', 'Todo modelo de trabajo de Chegatta, listo para probar'],
    ['Six real, preloaded accounts. Staffing agencies, multi-site restaurants, construction projects, external managers and owners with many roles. Copy the login and explore.', 'Seis cuentas reales y precargadas. Agencias de trabajo temporal, restaurantes multi-sitio, proyectos de construcci\u00f3n, responsables externos y due\u00f1os con muchos roles. Copia el acceso y explora.'],
    ['Quick demo accounts \u00b7 password: ', 'Cuentas de demo r\u00e1pidas \u00b7 contrase\u00f1a: '],
    ['Owner', 'Propietario'],
    ['Agency', 'Agencia'],
    // scenario index + intro
    ['Operating models', 'Modelos de trabajo'],
    ['Every operating model, ready to explore', 'Todo modelo de trabajo, listo para explorar'],
    ['Pick the scenario that matches how you run work today, open the live app and explore the preloaded data.', 'Elige el escenario que refleja c\u00f3mo gestionas el trabajo hoy, abre la app en vivo y explora los datos precargados.'],
    ['One restaurant, many sites', 'Un restaurante, muchos sitios'],
    ['A single company operating a restaurant (or shop, hotel, clinic) across several work locations. Manage sites, per-site kiosks, employees and payroll in one place.', 'Una sola empresa que opera un restaurante (o tienda, hotel, cl\u00e9nica) en varias ubicaciones. Gestiona sitios, kioscos por sede, empleados y n\u00f3mina en un solo lugar.'],
    ['Staffing agency with client businesses', 'Agencia de trabajo temporal con empresas cliente'],
    ['Run a staffing agency: place employees at independent client companies across Europe, track assignments, and keep payroll separate across all of them.', 'Dirige una agencia de trabajo temporal: coloca empleados en empresas cliente independientes por toda Europa, rastrea asignaciones y mantiene la n\u00f3mina separada en todas.'],
    ['Construction / projects as sites', 'Construcci\u00f3n / proyectos como sitios'],
    ['Every project or work location becomes a site under your business, with contractors clocking in via kiosk \u2014 ideal for construction, hotels and factories.', 'Cada proyecto o ubicaci\u00f3n laboral se convierte en un sitio bajo tu negocio, con contratistas registrando entrada por kiosco, ideal para construcci\u00f3n, hoteles y f\u00e1bricas.'],
    ['Client with multiple work sites', 'Cliente con m\u00faltiples sitios de trabajo'],
    ['One company, many work locations. Each site gets its own manager and kiosk, all under a single business and payroll.', 'Una empresa, muchas ubicaciones laborales. Cada sitio tiene su propio gestor y kiosco, todo bajo un negocio y n\u00f3mina \u00famicos.'],
    ['Manager from another business', 'Gestor de otra empresa'],
    ['A client\u0027s own manager approves attendance only for the workers assigned to their site \u2014 never for your agency or other clients.', 'El gestor propio de un cliente aprueba la asistencia solo para los trabajadores asignados a su sitio, nunca para tu agencia ni otros clientes.'],
    ['Separate ownership, employment and access', 'Separaci\u00f3n de propiedad, empleo y acceso'],
    ['One person can own a business, employ staff, manage sites and approve attendance \u2014 every role kept independent, exactly like the real world.', 'Una persona puede poseer un negocio, emplear al personal, gestionar sitios y aprobar asistencias, manteniendo cada rol independiente, exactamente como en el mundo real.'],
    // feature-type labels + buttons
    ['Scenario ', 'Escenario '],
    ['Copy', 'Copiar'],
    ['Open this scenario', 'Abrir este escenario'],
    // cta
    ['Ready to run your business on Chegatta?', '\u00bfListo para gestionar tu negocio en Chegatta?'],
    ['Start your free 14-day trial. No credit card. One-click upgrade.', 'Comienza tu prueba gratuita de 14 d\u00edas. Sin tarjeta. Actualizaci\u00f3n en un clic.'],
  ],
  pt: [
    ['Live Demo \u2014 Every Chegatta Operating Model, Ready to Try', 'Demo ao vivo \u2014 Todo modelo de opera\u00e7\u00e3o do Chegatta, pronto para experimentar'],
    ['Explore every Chegatta operating model on a real, preloaded account. Staffing agencies, multi-site restaurants, construction projects, external managers and more \u2014 copy a test email and log in. No sign-up.', 'Explore todos os modelos de opera\u00e7\u00e3o do Chegatta em uma conta real pr\u00e9-carregada. Ag\u00eAncias de trabalho, restaurantes multi-local, projetos de constru\u00e7\u00e3o, gestores externos e mais \u2014 copie um email de teste e entre. Sem cadastro.'],
    ['Six real, preloaded demo accounts. Staffing agencies, multi-site restaurant, construction, external managers and more. Copy the login and explore.', 'Seis contas de demonstra\u00e7\u00e3o reais e pr\u00e9-carregadas. Ag\u00eancias de trabalho, restaurante multi-local, constru\u00e7\u00e3o, gestores externos e mais. Copie o login e explore.'],
    ['Six real, preloaded demo accounts. Copy the login and explore Chegatta today.', 'Seis contas de demonstra\u00e7\u00e3o reais e pr\u00e9-carregadas. Copie o login e explore o Chegatta hoje.'],
    ['Chegatta Live Demo', 'Demo ao vivo do Chegatta'],
    ['Try every Chegatta operating model on a real, preloaded account. Test credentials included \u2014 just copy and log in, no sign-up.', 'Experimente todos os modelos de opera\u00e7\u00e3o do Chegatta em uma conta real pr\u00e9-carregada. Credenciais de teste inclu\u00eddas \u2014 copie e entre, sem cadastro.'],
    // navigation
    ['Home', 'In\u00edcio'],
    ['Features', 'Funcionalidades'],
    ['How It Works', 'Como funciona'],
    ['Pricing', 'Pre\u00e7os'],
    ['Solutions', 'Solu\u00e7\u00f5es'],
    ['FAQ', 'Perguntas frequentes'],
    ['Get Started', 'Come\u00e7ar teste'],
    ['Clock-In App', 'App de Ponto'],
    ['Kiosk Time Clock', 'Rel\u00f3gio de quiosque'],
    ['Payroll &amp; Compliance', 'Folha e conformidade'],
    ['HR Platform', 'Plataforma de RH'],
    ['Use Cases', 'Casos de uso'],
    ['Compare plans', 'Comparar planos'],
    // footer
    ['Attendance, simplified.', 'Assiduidade, simplificada.'],
    ['Product', 'Produto'],
    ['Company', 'Empresa'],
    ['About', 'Sobre n\u00f3s'],
    ['Careers', 'Carreiras'],
    ['Contact', 'Contato'],
    ['Blog', 'Blog'],
    // hero
    ['Live demo', 'Demo ao vivo'],
    ['Every way Chegatta is used, ready to try', 'Todo modelo de opera\u00e7\u00e3o do Chegatta, pronto para experimentar'],
    ['Six real, preloaded accounts. Staffing agencies, multi-site restaurants, construction projects, external managers and owners with many roles. Copy the login and explore.', 'Seis contas reais e pr\u00e9-carregadas. Ag\u00eancias de trabalho tempor\u00e1rio, restaurantes multi-local, projetos de constru\u00e7\u00e3o, gestores externos e propriet\u00e1rios com muitos pap\u00e9is. Copie o login e explore.'],
    ['Quick demo accounts \u00b7 password: ', 'Contas de demonstra\u00e7\u00e3o r\u00e1pidas \u00b7 senha: '],
    ['Owner', 'Propriet\u00e1rio'],
    ['Agency', 'Ag\u00eancia'],
    // scenario index + intro
    ['Operating models', 'Modelos de opera\u00e7\u00e3o'],
    ['Every operating model, ready to explore', 'Todo modelo de opera\u00e7\u00e3o, pronto para explorar'],
    ['Pick the scenario that matches how you run work today, open the live app and explore the preloaded data.', 'Escolha o cen\u00e1rio que reflete como gere o trabalho hoje, abra o app ao vivo e explore os dados pr\u00e9-carregados.'],
    ['One restaurant, many sites', 'Um restaurante, muitos locais'],
    ['A single company operating a restaurant (or shop, hotel, clinic) across several work locations. Manage sites, per-site kiosks, employees and payroll in one place.', 'Uma \u00fantica empresa a operar um restaurante (ou loja, hotel, cl\u00ednica) em v\u00e1rias localiza\u00e7\u00f5es. Gerencia sites, quiosques por local, colaboradores e folha em um s\u00f3 lugar.'],
    ['Staffing agency with client businesses', 'Ag\u00eancia de trabalho tempor\u00e1rio com empresas cliente'],
    ['Run a staffing agency: place employees at independent client companies across Europe, track assignments, and keep payroll separate across all of them.', 'Administre uma ag\u00eancia de trabalho tempor\u00e1rio: coloque colaboradores em empresas cliente independentes por toda a Europa, rastreie atribui\u00e7\u00f5es e mantenha a folha separada em todas.'],
    ['Construction / projects as sites', 'Constru\u00e7\u00e3o / projetos como locais'],
    ['Every project or work location becomes a site under your business, with contractors clocking in via kiosk \u2014 ideal for construction, hotels and factories.', 'Cada projeto ou local de trabalho torna-se um local sob sua empresa, com contratados registrando ponto via quiosque \u2014 ideal para constru\u00e7\u00e3o, hot\u00e9is e f\u00e1bricas.'],
    ['Client with multiple work sites', 'Cliente com m\u00faltiplos locais de trabalho'],
    ['One company, many work locations. Each site gets its own manager and kiosk, all under a single business and payroll.', 'Uma empresa, muitas localiza\u00e7\u00f5es de trabalho. Cada local tem seu pr\u00f3prio gestor e quiosque, tudo sob uma \u00fantica empresa e folha.'],
    ['Manager from another business', 'Gestor de outra empresa'],
    ['A client\u0027s own manager approves attendance only for the workers assigned to their site \u2014 never for your agency or other clients.', 'O gestor pr\u00f3prio de um cliente aprova a assiduidade apenas para os colaboradores atribu\u00eddos ao seu local \u2014 nunca para sua ag\u00eancia nem outros clientes.'],
    ['Separate ownership, employment and access', 'Separa\u00e7\u00e3o de propriedade, emprego e acesso'],
    ['One person can own a business, employ staff, manage sites and approve attendance \u2014 every role kept independent, exactly like the real world.', 'Uma pessoa pode possuir uma empresa, empregar colaboradores, gerir locais e aprovar assiduidade \u2014 mantendo cada papel independente, exatamente como no mundo real.'],
    // feature-type labels + buttons
    ['Scenario ', 'Cen\u00e1rio '],
    ['Copy', 'Copiar'],
    ['Open this scenario', 'Abrir este cen\u00e1rio'],
    // cta
    ['Ready to run your business on Chegatta?', 'Pronto para gerir sua empresa no Chegatta?'],
    ['Start your free 14-day trial. No credit card. One-click upgrade.', 'Comece seu teste gr\u00e1tis de 14 dias. Sem cart\u00e3o. Atualiza\u00e7\u00e3o em um clique.'],
  ],
};

/* Descriptive HTML comments are translated too (keeps the localized sources clean).
   The technical "i18n:" comment is intentionally left in English. */
const commentTranslations = {
  es: [
    ['<!-- Navigation -->', '<!-- Navegaci\u00f3n -->'],
    ['<!-- Hero -->', '<!-- H\u00e9roe -->'],
    ['<!-- Quick demo accounts -->', '<!-- Cuentas de demo r\u00e1pidas -->'],
    ['<!-- Scenarios grid -->', '<!-- Cuadr\u00edcula de escenarios -->'],
    ['<!-- A single company, many sites -->', '<!-- Una empresa con muchos sitios -->'],
    ['<!-- B staffing agency -->', '<!-- B: agencia de trabajo temporal -->'],
    ['<!-- G construction -->', '<!-- G: construcci\u00f3n -->'],
    ['<!-- D client with multiple sites -->', '<!-- D: cliente con m\u00faltiples sitios -->'],
    ['<!-- C / H external manager -->', '<!-- C / H: gestor externo -->'],
    ['<!-- I / J separate roles -->', '<!-- I / J: roles separados -->'],
    ['<!-- Call to action -->', '<!-- Llamada a la acci\u00f3n -->'],
    ['<!-- Footer -->', '<!-- Pie de p\u00e1gina -->'],
  ],
  pt: [
    ['<!-- Navigation -->', '<!-- Navega\u00e7\u00e3o -->'],
    ['<!-- Hero -->', '<!-- Her\u00f3i -->'],
    ['<!-- Quick demo accounts -->', '<!-- Contas de demonstra\u00e7\u00e3o r\u00e1pidas -->'],
    ['<!-- Scenarios grid -->', '<!-- Grade de cen\u00e1rios -->'],
    ['<!-- A single company, many sites -->', '<!-- Uma empresa com muitos locais -->'],
    ['<!-- B staffing agency -->', '<!-- B: ag\u00eancia de trabalho tempor\u00e1rio -->'],
    ['<!-- G construction -->', '<!-- G: constru\u00e7\u00e3o -->'],
    ['<!-- D client with multiple sites -->', '<!-- D: cliente com m\u00faltiplos locais -->'],
    ['<!-- C / H external manager -->', '<!-- C / H: gestor externo -->'],
    ['<!-- I / J separate roles -->', '<!-- I / J: pap\u00e9is separados -->'],
    ['<!-- Call to action -->', '<!-- Chamada para a\u00e7\u00e3o -->'],
    ['<!-- Footer -->', '<!-- Rodap\u00e9u -->'],
  ],
};

/* Apply a dictionary to a string, longest keys first to avoid overlaps. */
function applyDict(html, dict) {
  const sorted = [...dict].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    if (!from) continue;
    html = html.split(from).join(to); // literal, global replace
  }
  return html;
}

/* Prefix root-relative href/src values with ../ so they resolve from a subdir.
   Skips absolute URLs, mailto/tel/# anchors and already-prefixed paths. */
function prefixRelativePaths(html) {
  return html.replace(
    /(\bhref|src)="((?!https?:[\/][/]|mailto:|tel:|#|\.\.?\/|data:|file:)[^"]+)"/g,
    (match, attr, val) => `${attr}="../${val}"`,
  );
}

for (const [lang, dict] of Object.entries(dictionaries)) {
  let out = applyDict(enSource, dict);

  // translate descriptive HTML comments as well
  out = applyDict(out, (commentTranslations[lang] || []));


  // 1. <html lang="xx">
  out = out.replace(/(<html lang=")[a-z]+(")/, `$1${lang}$2`);

  // 2. canonical / og:url / ld+json url -> localized page
  out = out.replace(
    /<link rel="canonical" href="https:\/\/chegatta\.com\/demo\.html">/,
    `<link rel="canonical" href="https://chegatta.com/${lang}/demo.html">`,
  );
  out = out.replace(
    /<meta property="og:url" content="https:\/\/chegatta\.com\/demo\.html">/,
    `<meta property="og:url" content="https://chegatta.com/${lang}/demo.html">`,
  );
  out = out.replace(
    /"url":"https:\/\/chegatta\.com\/demo\.html"/,
    `"url":"https://chegatta.com/${lang}/demo.html"`,
  );

  // 3. prefix relative href/src for the subdir location
  out = prefixRelativePaths(out);

  // 4. keep the "Demo" active nav/footer link pointing to itself (same dir)
  out = out.replace(/href="\.\.\/demo\.html" class="active">Demo<\/a>/g, 'href="demo.html" class="active">Demo</a>');

  // 5. move the footer-lang active flag to the current language
  const footerLangBase = 'href="../demo.html" class="active">EN</a> • <a href="../pt/demo.html">PT</a> • <a href="../es/demo.html">ES</a>';
  if (lang === 'es') {
    out = out.replace(footerLangBase, 'href="../demo.html">EN</a> • <a href="../pt/demo.html">PT</a> • <a href="../es/demo.html" class="active">ES</a>');
  } else if (lang === 'pt') {
    out = out.replace(footerLangBase, 'href="../demo.html">EN</a> • <a href="../pt/demo.html" class="active">PT</a> • <a href="../es/demo.html">ES</a>');
  }

  writeFileSync(resolve(root, lang, 'demo.html'), out, 'utf8');
  console.log(`Wrote ${lang}/demo.html (${out.length} bytes)`);
}
