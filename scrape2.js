const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to fetch and parse a single market's detailed page
async function fetchMarketDetails(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const marketDetails = {};
    const additionalInfo = [];

    marketDetails.title = $('.elementor-heading-title').first().text().trim();
    marketDetails.description = $('.elementor-widget-text-editor p').first().text().trim();
    marketDetails.rentalCost = $('.elementor-widget-text-editor:contains("ค่าเช่า") p').text().trim();
    marketDetails.location = $('.elementor-widget-text-editor:contains("สถานที่") p').text().trim();
    marketDetails.facebookLink = $('.elementor-widget-text-editor a[href*="facebook"]').attr('href');

    
    $('.elementor-widget-text-editor ul li').each((i, element) => {
      additionalInfo.push($(element).text().trim());
    });

    return { marketDetails, additionalInfo };
  } catch (error) {
    console.error('Error fetching individual market details:', error);
    return null;
  }
}

// Main function to fetch markets and their details
async function fetchMarkets(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const markets = [];

    // Iterate through each market post
    $('.elementor-post').each(async (index, element) => {
      const title = $(element).find('.elementor-post__title').text().trim();
      const link = $(element).find('.elementor-post__thumbnail__link').attr('href');
      const description = $(element).find('.elementor-post__excerpt p').text().trim();
      
      // Fetch detailed info from market's own page
      const marketDetails = await fetchMarketDetails(link);

      markets.push({ title, link, description, ...marketDetails });
    });

    // Log the results
    setTimeout(() => console.log(markets), 1000); // Added delay to ensure async fetches complete
  } catch (error) {
    console.error('Error fetching market list:', error);
  }
}

// URL of the main market page
const mainUrl = 'https://www.xn--l3cb2cwa9ac.com/market';
fetchMarkets(mainUrl);
