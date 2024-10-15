const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function fetchMarketList(page) {
  const url = `https://thaimarket.biz/markets?page=${page}`;
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const markets = [];

    $('div[class*="grid-cols"] div.w-full.h-full.relative.rounded-lg.border.border-card-border.bg-white.text-left').each((index, element) => {
      const marketName = $(element).find('h4.truncate').text().trim();
      const marketRating = $(element).find('p.flex span.ml-1.truncate.text-sm').first().text().trim();
      const marketAddress = $(element).find('p.flex span.ml-1.truncate.text-sm').last().text().trim();
      const marketPrice = $(element).find('p.absolute span.text-lg.font-bold').text().trim();
      const urlimageProfile = $(element).find('a img').attr('src');
      const linkDetail = 'https://thaimarket.biz' + $(element).find('a').attr('href');

      markets.push({
        marketName,
        marketRating,
        marketAddress,
        marketPrice,
        urlimageProfile,
        linkDetail,
        detailMarket: []
      });
    });

    return markets;
  } catch (error) {
    console.error(`Error fetching market list for page ${page}:`, error);
    return [];
  }
}

async function fetchMarketDetails(market) {
  try {
    const response = await axios.get(market.linkDetail);
    const html = response.data;
    const $ = cheerio.load(html);

    const marketDetail = $('h1.text-3xl.font-semibold').text().trim();
    const ratingDetail = $('a span.font-semibold.text-sm.text-secondary-500').first().text().trim();
    const addressDetail = $('p.font-light.text-sm').first().text().trim();
    const typeOfShops = [];

    $('div.flex.flex-wrap div.mr-1.mt-1.border.border-card-border').each((index, element) => {
      typeOfShops.push($(element).text().trim());
    });

    market.detailMarket.push({
      marketDetail,
      ratingDetail,
      addressDetail,
      typeOfShops
    });
  } catch (error) {
    console.error(`Error fetching details for ${market.marketName}:`, error);
  }
}

async function fetchMarkets(maxPages) {
  try {
    let allMarkets = [];

    for (let page = 1; page <= maxPages; page++) {
      const markets = await fetchMarketList(page);
      allMarkets = allMarkets.concat(markets);
    }

    for (const market of allMarkets) {
      await fetchMarketDetails(market);
    }

    // Save the market data as JSON to a file
    const jsonData = JSON.stringify(allMarkets, null, 2);
    fs.writeFile("dataMarket.json", jsonData, "utf8", function (err) {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log("Data saved successfully to dataMarket.json");
      }
    });
  } catch (error) {
    console.error("Error fetching market list:", error);
  }
}

// Define the maximum number of pages to scrape
const maxPages = 5;
fetchMarkets(maxPages);