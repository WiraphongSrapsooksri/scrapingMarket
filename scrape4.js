const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to fetch and parse a single market's detailed page
async function fetchMarketDetails(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract specific details as needed from the market page
    const title = $('.elementor-heading-title').first().text().trim();
    const description = $('.elementor-widget-text-editor p').first().text().trim();
    const rentalCost = $('.elementor-widget-text-editor:contains("ค่าเช่า") p').text().trim();
    const location = $('.elementor-widget-text-editor:contains("สถานที่") p').text().trim();
    const facebookLink = $('.elementor-widget-text-editor a[href*="facebook"]').attr('href');

    const additionalInfo = [];
    $('.elementor-widget-text-editor ul li').each((i, element) => {
      additionalInfo.push($(element).text().trim());
    });

    return {
      title,
      description,
      rentalCost,
      location,
      facebookLink,
      additionalInfo,
    };
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
    const marketLinks = [];

    // Collect market links from the main market listing page
    $('.elementor-post').each((index, element) => {
      const link = $(element).find('.elementor-post__thumbnail__link').attr('href');
      if (link) marketLinks.push(link);
    });

    // Fetch details for all markets concurrently
    const marketDetailsPromises = marketLinks.map(link => fetchMarketDetails(link));
    const markets = await Promise.all(marketDetailsPromises);

    // Log the results after all requests are complete
    console.log(markets.filter(market => market !== null)); // filter out any null responses due to errors
  } catch (error) {
    console.error('Error fetching market list:', error);
  }
}

// URL of the main market page
const mainUrl = 'https://www.xn--l3cb2cwa9ac.com/market';
fetchMarkets(mainUrl);
