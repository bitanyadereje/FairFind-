const scraperapi = require('scraperapi-sdk')('YOUR_API_KEY');

async function test() {
  const url = 'https://jiji.et/phones';
  console.log('Fetching...');
  const html = await scraperapi.get(url, { render: true });
  console.log('HTML length:', html.length);
  console.log('First 1000 chars:', html.substring(0, 1000));
  if (html.includes('captcha') || html.includes('access denied')) {
    console.log('BLOCKED – likely CAPTCHA');
  } else if (html.includes('.b-list-advert-item')) {
    console.log('Found .b-list-advert-item class – selector likely works');
  } else {
    console.log('No known listing class found – need to inspect HTML');
  }
}

test();
