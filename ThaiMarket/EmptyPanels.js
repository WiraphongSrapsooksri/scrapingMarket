const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;

function extractImageUrl(imageElement) {
  if (imageElement && imageElement.attribs && imageElement.attribs.src) {
    let imageUrl = imageElement.attribs.src;
    if (imageUrl.includes('?url=')) {
      const match = imageUrl.match(/\?url=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
  }
  return '';
}

function parseThaimarketAvailableStalls(html) {
  const $ = cheerio.load(html);
  const panelElements = $('div.flex.flex-row.rounded-md.border.border-card-border');
  
  const emptyPanels = panelElements.map((index, panel) => {
    const $panel = $(panel);
    
    const imageUrl = extractImageUrl($panel.find('img')[0]);
    const stallNumber = $panel.find('p.text-xl.text-secondary-500').text().trim();
    const zone = $panel.find('div.m-1.flex.flex-row.lg\\:m-0.md\\:flex-col p').text().trim();
    const areaType = $panel.find('div:nth-child(2) p.ml-2.line-clamp-1.text-xs.text-text-value').text().trim();
    const size = $panel.find('div:nth-child(3) p.ml-2.text-xs.text-text-value').text().trim();
    const price = $panel.find('p.text-xl.font-bold.leading-none').text().trim();
    const discountText = $panel.find('p.text-xs.text-remark-800').text().trim();
    const originalPrice = $panel.find('p.md\\:mr-4.text-xs.text-red-500.line-through').text().trim();
    const discountedPrice = $panel.find('p.text-xl.font-bold.leading-none').text().trim();
    
    return {
      stallNumber,
      zone,
      areaType,
      size,
      price,
      discountText,
      originalPrice,
      discountedPrice,
      imageUrl
    };
  }).get();
  
  return emptyPanels;
}

async function scrapeThaimarketNumchaiFair() {
  const url = "https://www.thaimarket.biz/markets/ตลาดนำชัยแฟร์-numchai-fair";
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Wait for the content to load
    await page.waitForSelector('div.flex.flex-row.rounded-md.border.border-card-border');
    
    // Scroll to load all content
    let lastHeight = await page.evaluate('document.body.scrollHeight');
    while (true) {
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(2000);
      let newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === lastHeight) {
        break;
      }
      lastHeight = newHeight;
    }
    
    // Get the page source after JavaScript has loaded the content
    const htmlContent = await page.content();
    
    // Parse the HTML content
    const stallsData = parseThaimarketAvailableStalls(htmlContent);
    
    return stallsData;
  } finally {
    await browser.close();
  }
}

// Scrape the data
scrapeThaimarketNumchaiFair()
  .then(stallsData => {
    if (stallsData && stallsData.length > 0) {
      // Save to JSON file
      return fs.writeFile(
        'thaimarket_numchai_fair_stalls.json',
        JSON.stringify(stallsData, null, 2),
        'utf8'
      ).then(() => stallsData);
    } else {
      throw new Error("No data was scraped.");
    }
  })
  .then(stallsData => {
    console.log(`Data for ${stallsData.length} available stalls has been scraped and saved to thaimarket_numchai_fair_stalls.json`);
  })
  .catch(error => {
    console.error("An error occurred:", error.message);
  });