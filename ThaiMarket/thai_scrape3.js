const puppeteer = require("puppeteer");
const fs = require("fs").promises;

async function fetchMarketList(browser, page) {
  const url = `https://thaimarket.biz/markets?page=${page}`;
  const pageInstance = await browser.newPage();
  await pageInstance.goto(url, { waitUntil: "networkidle0" });

  const markets = await pageInstance.$$eval(
    'div[class*="grid-cols"] div.w-full.h-full.relative.rounded-lg.border.border-card-border.bg-white.text-left',
    (elements) => {
      return elements.map((element) => {
        const marketName =
          element.querySelector("h4.truncate")?.textContent.trim() || "";
        const marketRating =
          element
            .querySelector("p.flex span.ml-1.truncate.text-sm")
            ?.textContent.trim() || "";

        const parentElement = document.querySelector(
          "div.w-full.h-full.relative"
        );

        // เลือก span ที่สองที่อยู่ภายใน parent element
        const marketAddress =
          parentElement
            .querySelectorAll("span.ml-1.truncate.text-sm")[1]
            ?.textContent.trim() || "";

        const marketPrice =
          element
            .querySelector("p.absolute span.text-lg.font-bold")
            ?.textContent.trim() || "";
        // const urlimageProfile =
        //   element.querySelector("a img")?.getAttribute("src") || "";

        // const imageUrlElement = document.querySelector("a img");
        // let imageUrl = imageUrlElement?.getAttribute("src") || "";

        // if (imageUrl) {
        //   // แปลงลิงก์ที่เข้ารหัสเป็นลิงก์ที่ใช้งานได้จริง
        //   imageUrl = decodeURIComponent(
        //     imageUrl.split("?url=")[1].split("&")[0]
        //   );
        // }
        // ดึงค่า src ของรูปภาพและถอดรหัส URL
        let imageUrl = element.querySelector("a img")?.getAttribute("src") || "";
        if (imageUrl) {
          imageUrl = decodeURIComponent(imageUrl.split("?url=")[1]?.split("&")[0]);
        }
        
        const linkDetail =
          "https://thaimarket.biz" +
          (element.querySelector("a")?.getAttribute("href") || "");

        return {
          marketName,
          marketRating,
          marketAddress,
          marketPrice,
          urlimageProfile:imageUrl,
          linkDetail,
          detailMarket: [],
        };
      });
    }
  );

  await pageInstance.close();
  return markets;
}

async function fetchMarketDetails(browser, market) {
  const pageInstance = await browser.newPage();
  await pageInstance.goto(market.linkDetail, { waitUntil: "networkidle0" });

  try {
    await pageInstance.waitForSelector("h1.text-3xl.font-semibold", {
      timeout: 5000,
    });

    const marketDetail = await pageInstance.$eval(
      "h1.text-3xl.font-semibold",
      (el) => el.textContent.trim()
    );
    const ratingDetail = await pageInstance.$eval(
      "a span.font-semibold.text-sm.text-secondary-500",
      (el) => el.textContent.trim()
    );
    const addressDetail = await pageInstance.$eval(
      "p.font-light.text-sm",
      (el) => el.textContent.trim()
    );

    const googleMapLink = await pageInstance.evaluate(() => {
      const linkElement = document.querySelector('a[href*="google.com/maps"]');
      return linkElement ? linkElement.href : null; 
    });

    const typeOfShops = await pageInstance.$$eval(
      "div.flex.flex-wrap div.mr-1.mt-1.border.border-card-border",
      (elements) => elements.map((el) => el.textContent.trim())
    );
    const marketHighlights = await pageInstance.$$eval(
      "div.rounded-md.border.border-card-border.bg-white.p-4 ul li",
      (elements) =>
        elements.map((el) => el.querySelector("p")?.textContent.trim() || "")
    );

    const additionalInfo = await pageInstance.evaluate(() => {
      const priceRange =
        document
          .querySelector(
            "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div:nth-child(4) > div:nth-child(2) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const areaSize =
        document
          .querySelector(
            "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div:nth-child(4) > div:nth-child(3) > div:nth-child(1) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const availableSpaces =
        document
          .querySelector(
            "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div:nth-child(4) > div:nth-child(3) > div:nth-child(2) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const parkingSpots =
        document
          .querySelector(
            "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div:nth-child(4) > div:nth-child(4) > div:nth-child(1) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const toilets =
        document
          .querySelector(
            "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div:nth-child(4) > div:nth-child(4) > div:nth-child(2)"
          )
          ?.textContent.trim()
          .replace(/^จำนวนห้องน้ำ/, "") || "-";

      const operationTime =
        document
          .querySelector(
            "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div:nth-child(4) > div:nth-child(5) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const transportation =
        document
          .querySelector("div.my-2 div.prose.mt-2 p")
          ?.textContent.trim() || "-";

      const vendorNotes =
        document
          .querySelector(
            "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div:nth-child(4) > div:nth-child(7) > div"
          )
          ?.textContent.trim() || "-";

      return {
        priceRange,
        areaSize,
        availableSpaces,
        parkingSpots,
        toilets,
        operationTime,
        transportation,
        vendorNotes,
      };
    });

    const marketLocation = await pageInstance.evaluate(() => {
      const locationElement = document.querySelector(
        "div.rounded-md.border.border-card-border.bg-white.p-4 h2.text-xl"
      );
      if (locationElement) {
        const container = locationElement.parentElement;
        const nearbyPlaces = Array.from(
          container.querySelectorAll("ul.list-disc li")
        ).map((li) => li.textContent.trim());
        const mapIframe =
          container.querySelector("iframe")?.getAttribute("src") || "";

        return {
          nearbyLocations: nearbyPlaces,
          mapIframe,
        };
      }
      return null;
    });

    const marketContract = await pageInstance.evaluate(() => {
      const startPrice = document.querySelector('h2.flex span.text-xl.font-semibold')?.textContent.trim() || '-';
      const note = document.querySelector('div.my-5')?.textContent.trim() || '-';
      const initialCost = document.querySelector('div.my-3.flex.justify-between:nth-child(4) div:nth-child(2)')?.textContent.trim() || '-';
      const insurancePremium = document.querySelector('div.my-3.flex.justify-between:nth-child(5) div:nth-child(2)')?.textContent.trim() || '-';
      const advanceRent = document.querySelector('div.my-3.flex.justify-between:nth-child(6) div:nth-child(2)')?.textContent.trim() || '-';
      const waterFee = document.querySelector('div.my-3.flex.justify-between:nth-child(7) div:nth-child(2)')?.textContent.trim() || '-';
      const electricityBill = document.querySelector('div.my-3.flex.justify-between:nth-child(8) div:nth-child(2)')?.textContent.trim() || '-';
      const otherExpenses = document.querySelector('div.my-3.flex.justify-between:nth-child(9) div:nth-child(2)')?.textContent.trim() || '-';
      // const total = document.querySelector('div.my-3.flex.justify-between:nth-child(12) div.text-md.font-semibold')?.textContent.trim() || '-';
      const total = document.querySelector('div.text-md.font-semibold.text-right')?.textContent.trim() || '-';
      return {
        startPrice,
        note,
        initialCost,
        insurancePremium,
        advanceRent,
        waterFee,
        electricityBill,
        otherExpenses,
        total,
      };
    });

    // const detailMarket = await pageInstance.evaluate(() => {
    //   // ดึงข้อความทั้งหมดจาก h3 และ p ภายใน div ที่มี class "prose mt-2"
    //   const textContent = document.querySelector('div.prose.mt-2')?.innerText.trim() || '-';
    
    //   // ดึง src ของรูปภาพ (ซึ่งเป็นรูปแบบ base64 ในกรณีนี้)
    //   const imageSrc = document.querySelector('div.prose.mt-2 img')?.getAttribute('src') || '-';
    
    //   return {
    //     textContent,
    //     imageSrc
    //   };
    // });

    const detailMarket = await pageInstance.evaluate(() => {
      // ดึงข้อความทั้งหมดจาก h3 ใน div ที่มี class "prose mt-2"
      const textElements = document.querySelectorAll('div.prose.mt-2 h3');
      const textContent = Array.from(textElements).map(el => el.textContent.trim());
    
      // ดึงที่อยู่ URL ของรูปภาพทั้งหมดจาก img ใน div ที่มี class "prose mt-2"
      const imageElements = document.querySelectorAll('div.prose.mt-2 img');
      const imageSrcs = Array.from(imageElements).map(img => img.src);
    
      return {
        textContent,
        imageSrcs
      };
    });


    const imageMarket = await pageInstance.evaluate(()=> {

      const imageElements = document.querySelectorAll('relative mx-auto max-w-7xl');
      const imageMarketlist = Array.from(imageElements).map(img => img.scr);
      
      // let imageUrl = element.querySelector("a img")?.getAttribute("src") || "";
      // if (imageUrl) {
      //   imageUrl = decodeURIComponent(imageUrl.split("?url=")[1]?.split("&")[0]);
      // }
      return imageMarketlist
    })

    market.detailMarket.push({
      marketDetail,
      ratingDetail,
      addressDetail,
      googleMapLink,
      typeOfShops,
      marketHighlights,
      additionalInfo,
      detailMarket,
      marketLocation,
      marketContract,
      imageMarket
    });
  } catch (error) {
    console.error(`Error fetching details for ${market.marketName}:`, error);
  }

  await pageInstance.close();
}

async function fetchMarkets(maxPages) {
  const browser = await puppeteer.launch({ headless: true });

  try {
    let allMarkets = [];

    for (let page = 1; page <= maxPages; page++) {
      const markets = await fetchMarketList(browser, page);
      allMarkets = allMarkets.concat(markets);
    }

    await Promise.all(
      allMarkets.map((market) => fetchMarketDetails(browser, market))
    );

    const jsonData = JSON.stringify(allMarkets, null, 2);
    await fs.writeFile("dataMarket3.json", jsonData, "utf8");
    console.log("Data saved successfully to dataMarket3.json");
  } catch (error) {
    console.error("Error fetching market data:", error);
  } finally {
    await browser.close();
  }
}

const maxPages = 1;
fetchMarkets(maxPages);
