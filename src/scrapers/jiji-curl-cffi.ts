import { Curl } from 'curl-cffi-node';

async function fetchJiji(category: string) {
  const curl = new Curl();
  const url = `https://jiji.et/${category}`;
  curl.setOpt(Curl.option.URL, url);
  curl.setOpt(Curl.option.SSL_VERIFYPEER, false); // bypass SSL verification
  curl.setOpt(Curl.option.USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  curl.setOpt(Curl.option.IMPERSONATE, 'chrome'); // key option to mimic browser TLS
  
  return new Promise((resolve, reject) => {
    curl.on('end', (statusCode, data) => {
      curl.close();
      resolve(data);
    });
    curl.on('error', reject);
    curl.perform();
  });
}