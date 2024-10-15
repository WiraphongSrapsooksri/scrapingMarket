const puppeteer = require('puppeteer');
const fs = require("fs");

async function fetchMarketList(page) {
  const url = `https://thaimarket.biz/markets?page=${page}`;
  const browser = await puppeteer.launch({ headless: true });
  const pageInstance = await browser.newPage();
  await pageInstance.goto(url);
  const markets = [];

  const marketElements = await pageInstance.$$eval('div[class*="grid-cols"] div.w-full.h-full.relative.rounded-lg.border.border-card-border.bg-white.text-left', elements => {
    return elements.map(element => {
      const marketName = element.querySelector('h4.truncate')?.textContent.trim() || "";
      const marketRating = element.querySelector('p.flex span.ml-1.truncate.text-sm')?.textContent.trim() || "";
      const marketAddress = element.querySelector('p.flex span.ml-1.truncate.text-sm:last-of-type')?.textContent.trim() || "";
      const marketPrice = element.querySelector('p.absolute span.text-lg.font-bold')?.textContent.trim() || "";
      const urlimageProfile = element.querySelector('a img')?.getAttribute('src') || "";
      const linkDetail = 'https://thaimarket.biz' + (element.querySelector('a')?.getAttribute('href') || "");

      return {
        marketName,
        marketRating,
        marketAddress,
        marketPrice,
        urlimageProfile,
        linkDetail,
        detailMarket: []
      };
    });
  });

  await browser.close();
  return marketElements;
}

async function fetchMarketDetails(market) {
  const browser = await puppeteer.launch({ headless: true });
  const pageInstance = await browser.newPage();
  await pageInstance.goto(market.linkDetail);

  try {
    const marketDetail = await pageInstance.$eval('h1.text-3xl.font-semibold', el => el.textContent.trim());
    const ratingDetail = await pageInstance.$eval('a span.font-semibold.text-sm.text-secondary-500', el => el.textContent.trim());
    const addressDetail = await pageInstance.$eval('p.font-light.text-sm', el => el.textContent.trim());
    const typeOfShops = await pageInstance.$$eval('div.flex.flex-wrap div.mr-1.mt-1.border.border-card-border', elements => {
      return elements.map(el => el.textContent.trim());
    });
    const marketHighlights = await pageInstance.$$eval('div.rounded-md.border.border-card-border.bg-white.p-4 ul li', elements => {
      return elements.map(el => el.querySelector('p')?.textContent.trim() || "");
    });
    const additionalInfo = await pageInstance.$eval('div.rounded-md.border.border-card-border.bg-white.p-4:has(h2:contains("ข้อมูลเพิ่มเติมตลาดนี้"))', el => {
      const priceRange = el.querySelector('div.my-2 p.font-bold + p')?.textContent.trim() || "-";
      const areaSize = el.querySelector('div.grid-cols-1.md\:grid-cols-2.my-2 div:nth-child(1) p.font-bold + p')?.textContent.trim() || "-";
      const availableSpaces = el.querySelector('div.grid-cols-1.md\:grid-cols-2.my-2 div:nth-child(2) p.font-bold + p')?.textContent.trim() || "-";
      const parkingSpots = el.querySelector('div.grid-cols-1.md\:grid-cols-2.my-2 div:nth-child(3) p.font-bold + p')?.textContent.trim() || "-";
      const toilets = el.querySelector('div.grid-cols-1.md\:grid-cols-2.my-2 div:nth-child(4) p.font-bold + p')?.textContent.trim() || "-";
      const operationTime = el.querySelector('div.my-2:has(p.font-bold:contains("วันเวลาทำการ")) p.font-bold + p')?.textContent.trim() || "-";
      const transportation = el.querySelector('div.prose.mt-2 p')?.textContent.trim() || "-";
      const vendorNotes = el.querySelector('div.prose.mt-2:has(p.font-bold:contains("สิ่งที่อยากบอกถึงพ่อค้าแม่ค้า")) p')?.textContent.trim() || "-";

      return {
        priceRange,
        areaSize,
        availableSpaces,
        parkingSpots,
        toilets,
        operationTime,
        transportation,
        vendorNotes
      };
    });

    market.detailMarket.push({
      marketDetail,
      ratingDetail,
      addressDetail,
      typeOfShops,
      marketHighlights,
      additionalInfo
    });
  } catch (error) {
    console.error(`Error fetching details for ${market.marketName}:`, error);
  }

  await browser.close();
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