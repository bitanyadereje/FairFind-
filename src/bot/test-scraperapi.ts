const scraperapi = require('scraperapi-sdk')('1dc8365d20d1d84be5b4317ca9991252');

async function test() {
  const url = 'https://jiji.et/phones';
  console.log('Fetching...');
  const html = await scraperapi.get(url, { render: true });
  console.log('HTML length:', html.length);
  console.log('First 1000 chars:', html.substring(0, 1000));
  if (html.includes('captcha') || html.includes('access denied')) {
    console.log('BLOCKED – likely CAPTCHA');
  }
}

test();