const puppeteer = require('puppeteer');
const fs = require('fs');

const baseUrl = 'https://www.xn--l3cb2cwa9ac.com/market';
let currentPage = 1;
const allMarkets = [];

// Maximum pages to scrape
const maxPages = 5; // Change this number as needed

async function scrapeMarkets() {
  const browser = await puppeteer.launch({ headless: false }); // Set headless to false to see the browser
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });

    while (currentPage <= maxPages) {
      console.log(`Scraping page ${currentPage}...`);

      // Wait for the posts to load
      await page.waitForSelector('.elementor-post');

      // Extract data from the page
      const markets = await page.$$eval('.elementor-post', posts => {
        return posts.map(post => {
          const title = post.querySelector('.elementor-post__title')?.innerText.trim();
          const link = post.querySelector('.elementor-post__thumbnail__link')?.href;
          const description = post.querySelector('.elementor-post__excerpt p')?.innerText.trim();
          return { title, link, description };
        });
      });

      allMarkets.push(...markets);

      // Check if there is a "next" button and click it
    //   $('.jet-filters-pagination__item.prev-next.next');
      const link = $(element)
      .find(".elementor-post__thumbnail__link")
      .attr("href");
      
    if (link) marketLinks.push(link);
    //   if (nextButton && currentPage < maxPages) {
    //     currentPage++;
    //     await Promise.all([
    //       nextButton.click(),
    //       page.waitForNavigation({ waitUntil: 'networkidle2' }),
    //     ]);
    //   } else {
    //     break; // Exit the loop if no "next" button is found or max pages reached
    //   }
    }

    console.log('Finished scraping. Saving data...');
    saveData();

  } catch (error) {
    console.error('Error scraping page:', error);
    saveData(); // Save data even if an error occurs
  } finally {
    await browser.close();
  }
}

function saveData() {
  fs.writeFile('markets.json', JSON.stringify(allMarkets, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log(`Data saved to markets.json. Total markets: ${allMarkets.length}`);
    }
  });
}

console.log('Starting to scrape markets...');
scrapeMarkets();