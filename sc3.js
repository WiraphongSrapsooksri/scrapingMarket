const axios = require('axios');
const cheerio = require('cheerio');

const baseURL = 'https://www.xn--l3cb2cwa9ac.com/market';

// Helper function to fetch and parse a single page
async function fetchPage(url) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const markets = [];

  $('.elementor-post').each((index, element) => {
    const title = $(element).find('.elementor-post__title').text().trim();
    const link = $(element).find('.elementor-post__thumbnail__link').attr('href');
    const description = $(element).find('.elementor-post__excerpt p').text().trim();
    markets.push({ title, link, description });
  });

  return markets;
}

// Function to navigate through all pages
async function scrapeAllPages() {
  try {
    let active = true;
    let currentPage = 1;
    const allMarkets = [];

    while (active) {
      const url = `${baseURL}?page=${currentPage}`;
      const markets = await fetchPage(url);
      console.log(`Fetching page ${currentPage} with ${markets.length} markets.`);
      allMarkets.push(...markets);

      // Update current page or terminate if no more pages
      const nextPage = currentPage + 1;
      const testUrl = `${baseURL}?page=${nextPage}`;
      const response = await axios.get(testUrl);
      const test$ = cheerio.load(response.data);
      const exists = test$('.elementor-post').length > 0;

      if (exists) {
        currentPage = nextPage;
      } else {
        active = false;
      }
    }

    console.log('Finished fetching all markets.');
    return allMarkets;
  } catch (error) {
    console.error('Error scraping markets:', error);
  }
}

scrapeAllPages();
