const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    }).on('error', reject);
  });
}

(async () => {
  try {
    const home = await get('http://localhost:3000');
    console.log('Homepage status:', home.status);
    
    // Find stylesheet href
    // Link format in Next.js: <link rel="stylesheet" href="/_next/static/css/..." />
    const hrefs = [];
    const regex = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g;
    let match;
    while ((match = regex.exec(home.data)) !== null) {
      hrefs.push(match[1]);
    }
    
    console.log('Found stylesheets:', hrefs);
    
    for (const href of hrefs) {
      const cssUrl = href.startsWith('http') ? href : `http://localhost:3000${href}`;
      const css = await get(cssUrl);
      console.log(`Checking stylesheet: ${href} (length: ${css.data.length})`);
      
      // Look for .dark rules
      if (css.data.includes('.dark')) {
        console.log('FOUND .dark IN CSS!');
        
        // Print where it is or a snippet
        const idx = css.data.indexOf('.dark');
        console.log('CSS Snippet around .dark:', css.data.substring(Math.max(0, idx - 50), idx + 200));
      } else {
        console.log('.dark NOT found in this stylesheet');
      }
    }
    
  } catch (err) {
    console.error('Error fetching CSS:', err);
  }
})();
