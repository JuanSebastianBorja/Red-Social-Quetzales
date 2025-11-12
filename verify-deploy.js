#!/usr/bin/env node
// Script de verificación del deploy en Netlify
// Verifica que las páginas clave estén disponibles y funcionando

const https = require('https');

const BASE_URL = 'https://quetzal-platform.netlify.app';

const pages = [
  { path: '/', name: 'Landing Page' },
  { path: '/views/landing-page.html', name: 'Landing Page (Direct)' },
  { path: '/views/login.html', name: 'Login' },
  { path: '/views/register.html', name: 'Register' },
  { path: '/views/services-public.html', name: 'Services Public' },
  { path: '/views/contracts.html', name: 'Contracts (NEW)' },
  { path: '/views/messages.html', name: 'Messages' },
  { path: '/views/wallet.html', name: 'Wallet' },
  { path: '/views/pse-callback.html', name: 'PSE Callback (NEW)' },
  { path: '/public/js/contracts.js', name: 'Contracts JS (NEW)' },
  { path: '/public/css/messages.css', name: 'Messages CSS (NEW)' }
];

function checkUrl(url, name) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const status = res.statusCode;
      const ok = status === 200;
      console.log(`${ok ? '✅' : '❌'} [${status}] ${name}`);
      if (!ok && status !== 404) {
        console.log(`   URL: ${url}`);
      }
      resolve({ name, status, ok });
    }).on('error', (err) => {
      console.log(`❌ [ERROR] ${name}: ${err.message}`);
      resolve({ name, status: 'ERROR', ok: false });
    });
  });
}

async function main() {
  console.log('🔍 Verificando deploy en Netlify...\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);
  
  const results = [];
  for (const page of pages) {
    const url = BASE_URL + page.path;
    const result = await checkUrl(url, page.name);
    results.push(result);
    await new Promise(r => setTimeout(r, 200)); // Rate limit
  }
  
  console.log('\n📊 Resumen:');
  const ok = results.filter(r => r.ok).length;
  const total = results.length;
  console.log(`✅ OK: ${ok}/${total}`);
  console.log(`❌ Failed: ${total - ok}/${total}`);
  
  if (ok === total) {
    console.log('\n🎉 ¡Todos los recursos están disponibles!');
  } else {
    console.log('\n⚠️ Algunos recursos no están disponibles. Puede ser que Netlify aún esté desplegando.');
    console.log('Espera 1-2 minutos y ejecuta este script nuevamente.');
  }
  
  console.log('\n💡 Para verificar manualmente:');
  console.log(`   ${BASE_URL}/views/landing-page.html`);
  console.log(`   ${BASE_URL}/views/contracts.html (nuevo)`);
  console.log(`   ${BASE_URL}/views/messages.html`);
}

main();
