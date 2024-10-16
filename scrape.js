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

    // Click the accept cookies button if present
    const acceptCookiesButton = await page.$('#wt-cli-accept-all-btn');
    if (acceptCookiesButton) {
      await acceptCookiesButton.click();
      await page.waitForTimeout(2000); // Wait for 2 seconds to ensure the action is processed
    }

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
      const nextButton = await page.$('.jet-filters-pagination__item.prev-next.next');

      if (nextButton && currentPage < maxPages) {
        currentPage++;
        await page.evaluate((button) => button.scrollIntoView(), nextButton); // Scroll to the next button
        await nextButton.click();
        await page.waitForTimeout(2000); // Wait for 2 seconds to allow content to load
      } else {
        break; // Exit the loop if no "next" button is found or max pages reached
      }
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