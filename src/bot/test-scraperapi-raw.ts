import axios from 'axios';

const API_KEY = '1dc8365d20d1d84be5b4317ca9991252'; // replace with your actual key
const url = 'https://jiji.et/phones';
const apiUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render=true`;

async function test() {
  try {
    console.log('Fetching:', apiUrl);
    const response = await axios.get(apiUrl);
    console.log('Status:', response.status);
    console.log('HTML length:', response.data.length);
    console.log('First 500 chars:', response.data.substring(0, 500));
    if (response.data.includes('captcha')) console.log('CAPTCHA page');
    else if (response.data.includes('.b-list-advert-item')) console.log('Found listing class');
    else console.log('No listing class found');
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

test();