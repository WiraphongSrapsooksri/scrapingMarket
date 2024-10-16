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

        const marketAddress =
          parentElement
            .querySelectorAll("span.ml-1.truncate.text-sm")[1]
            ?.textContent.trim() || "";

        const marketPrice =
          element
            .querySelector("p.absolute span.text-lg.font-bold")
            ?.textContent.trim() || "";

        let imageUrl =
          element.querySelector("a img")?.getAttribute("src") || "";
        if (imageUrl) {
          imageUrl = decodeURIComponent(
            imageUrl.split("?url=")[1]?.split("&")[0]
          );
        }

        const linkDetail =
          "https://thaimarket.biz" +
          (element.querySelector("a")?.getAttribute("href") || "");

        return {
          marketName,
          marketRating,
          marketAddress,
          marketPrice,
          urlimageProfile: imageUrl,
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

    const nearbyPlaces = await pageInstance.evaluate(() => {
      const nearbyPlacesList = document.querySelector("p.font-bold + ul");

      const nearbyPlaces = nearbyPlacesList
        ? Array.from(nearbyPlacesList.querySelectorAll("li")).map((li) =>
            li.textContent.trim()
          )
        : [];

      return nearbyPlaces;
    });

    const marketContract = await pageInstance.evaluate(() => {
      const startPrice =
        document
          .querySelector("h2.flex span.text-xl.font-semibold")
          ?.textContent.trim() || "-";
      const note =
        document.querySelector("div.my-5")?.textContent.trim() || "-";
      const initialCost =
        document
          .querySelector(
            "div.my-3.flex.justify-between:nth-child(4) div:nth-child(2)"
          )
          ?.textContent.trim() || "-";
      const insurancePremium =
        document
          .querySelector(
            "div.my-3.flex.justify-between:nth-child(5) div:nth-child(2)"
          )
          ?.textContent.trim() || "-";
      const advanceRent =
        document
          .querySelector(
            "div.my-3.flex.justify-between:nth-child(6) div:nth-child(2)"
          )
          ?.textContent.trim() || "-";
      const waterFee =
        document
          .querySelector(
            "div.my-3.flex.justify-between:nth-child(7) div:nth-child(2)"
          )
          ?.textContent.trim() || "-";
      const electricityBill =
        document
          .querySelector(
            "div.my-3.flex.justify-between:nth-child(8) div:nth-child(2)"
          )
          ?.textContent.trim() || "-";
      const otherExpenses =
        document
          .querySelector(
            "div.my-3.flex.justify-between:nth-child(9) div:nth-child(2)"
          )
          ?.textContent.trim() || "-";
      // const total = document.querySelector('div.my-3.flex.justify-between:nth-child(12) div.text-md.font-semibold')?.textContent.trim() || '-';
      const total =
        document
          .querySelector("div.text-md.font-semibold.text-right")
          ?.textContent.trim() || "-";
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

    const detailMarket = await pageInstance.evaluate(() => {
      const textElements = document.querySelectorAll("div.prose.mt-2 h3");
      const textContent = Array.from(textElements).map((el) =>
        el.textContent.trim()
      );

      const imageElements = document.querySelectorAll("div.prose.mt-2 img");
      const imageSrcs = Array.from(imageElements).map((img) => img.src);

      return {
        textContent,
        imageSrcs,
      };
    });

    const imageMarket = await pageInstance.evaluate(() => {
      const imageElements = document.querySelectorAll(
        "div.relative.mx-auto.max-w-7xl div.bg-cover"
      );

      const imageMarketlist = Array.from(imageElements).map((div) => {
        const style = window.getComputedStyle(div);
        const bgImage = style.backgroundImage;
        return bgImage.slice(5, -2);
      });

      return imageMarketlist;
    });

    const emptyPanels = await fetchEmptyPanels(pageInstance);

    market.detailMarket.push({
      marketDetail,
      ratingDetail,
      addressDetail,
      googleMapLink,
      typeOfShops,
      marketHighlights,
      additionalInfo,
      detailMarket,
      nearbyPlaces,
      marketContract,
      imageMarket,
    });

    market.Emptypanel = emptyPanels;
  } catch (error) {
    console.error(`Error fetching details for ${market.marketName}:`, error);
  }

  await pageInstance.close();
}

async function fetchEmptyPanels(pageInstance) {
  // ฟังก์ชันสำหรับดึงจำนวนหน้าทั้งหมด
  async function getTotalPages() {
    return await pageInstance.evaluate(() => {
      const paginationNav = document.querySelector(
        'nav[aria-label="Pagination"]'
      );
      if (!paginationNav) return 1;
      const buttons = paginationNav.querySelectorAll("button");
      const pageNumbers = Array.from(buttons)
        .map((btn) => parseInt(btn.textContent))
        .filter((num) => !isNaN(num));
      return pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
    });
  }

  let allEmptyPanels = [];
  const totalPages = await getTotalPages();

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const emptyPanels = await pageInstance.evaluate(() => {
      function extractImageUrl(imageElement) {
        let imageUrl = imageElement?.getAttribute("src") || "";
        if (imageUrl.includes("?url=")) {
          imageUrl = decodeURIComponent(
            imageUrl.split("?url=")[1]?.split("&")[0]
          );
        }
        return imageUrl;
      }

      const panelElements = document.querySelectorAll(
        "div.flex.flex-row.rounded-md.border.border-card-border"
      );

      const emptyPanels = Array.from(panelElements).map((panel) => {
        const imageUrl = extractImageUrl(panel.querySelector("img"));

        const stallNumber =
          panel
            .querySelector("p.text-xl.text-secondary-500")
            ?.textContent.trim() || "";
        const zone =
          panel
            .querySelector("div.m-1.flex.flex-row.lg\\:m-0.md\\:flex-col p")
            ?.textContent.trim() || "";
        const areaType =
          panel
            .querySelector(
              "div:nth-child(2) p.line-clamp-1.text-xs.text-text-value"
            )
            ?.textContent.trim() || "";
        const size =
        document
            .querySelector(
              "body > main > main > div:nth-child(2) > div.mt-4.md\\:mt-0.relative.grid.grid-cols-1.gap-4.bg-white.pb-12.md\\:grid-cols-12 > div.col-span-12.lg\\:col-span-8.flex.flex-col.gap-4 > div.rounded-md.border.border-card-border.bg-white.p-4.flex.flex-col.gap-2 > div:nth-child(2) > div.grid.w-full.px-3.py-2lg\\:px-4.py-3 > div:nth-child(1) > div > div:nth-child(3) > p"
            )
            ?.textContent.trim() || "";

        const price =
          panel
            .querySelector("p.text-xl.font-bold.leading-none")
            ?.textContent.trim() || "";

        const discountText =
          panel
            .querySelector("p.text-xs.text-remark-800")
            ?.textContent.trim() || "";
        const originalPrice =
          panel
            .querySelector("p.md\\:mr-4.text-xs.text-red-500.line-through")
            ?.textContent.trim() || "";
        const discountedPrice =
          panel
            .querySelector("p.text-xl.font-bold.leading-none")
            ?.textContent.trim() || "";

        return {
          stallNumber,
          zone,
          areaType,
          size,
          price,
          discountText,
          originalPrice,
          discountedPrice,
          imageUrl,
        };
      });

      return emptyPanels;
    });

    allEmptyPanels = allEmptyPanels.concat(emptyPanels);

    // คลิกปุ่มหน้าถัดไปถ้าไม่ใช่หน้าสุดท้าย
    if (currentPage < totalPages) {
      await pageInstance.evaluate((currentPage) => {
        const paginationNav = document.querySelector(
          'nav[aria-label="Pagination"]'
        );
        const buttons = Array.from(paginationNav.querySelectorAll("button"));
        const nextPageButton = buttons.find(
          (btn) => btn.textContent == (currentPage + 1).toString()
        );
        if (nextPageButton) {
          nextPageButton.click();
        }
      }, currentPage);

      // รอให้หน้าโหลด
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return allEmptyPanels;
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
