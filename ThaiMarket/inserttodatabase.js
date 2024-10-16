const puppeteer = require("puppeteer");
const sql = require("mssql");

// การตั้งค่าฐานข้อมูล
const config = {
  user: "Intern_user",
  password: "Max2003_01",
  server: "45.144.165.90",
  database: "InternDB",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// ฟังก์ชันหลักเพื่อดึงตลาดและแทรกข้อมูลลงในฐานข้อมูล
async function fetchMarkets(maxPages) {
  const browser = await puppeteer.launch({ headless: true });
  let pool;

  try {
    pool = await sql.connect(config);

    for (let page = 1; page <= maxPages; page++) {
      const markets = await fetchMarketList(browser, page);

      for (const market of markets) {
        await fetchMarketDetails(browser, market);
        await insertMarketData(pool, market);
      }
    }

    console.log("Data inserted successfully into the database.");
  } catch (error) {
    console.error("Error fetching market data:", error);
  } finally {
    await browser.close();
    if (pool) {
      await pool.close();
    }
  }
}

// ฟังก์ชันเพื่อดึงรายชื่อตลาดจากหน้าหลัก
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

        const parentElement = element.closest("div.w-full.h-full.relative");

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

// ฟังก์ชันเพื่อดึงรายละเอียดตลาดจากหน้ารายละเอียด
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
            "div:nth-child(4) > div:nth-child(2) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const areaSize =
        document
          .querySelector(
            "div:nth-child(4) > div:nth-child(3) > div:nth-child(1) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const availableSpaces =
        document
          .querySelector(
            "div:nth-child(4) > div:nth-child(3) > div:nth-child(2) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const parkingSpots =
        document
          .querySelector(
            "div:nth-child(4) > div:nth-child(4) > div:nth-child(1) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const toilets =
        document
          .querySelector(
            "div:nth-child(4) > div:nth-child(4) > div:nth-child(2)"
          )
          ?.textContent.trim()
          .replace(/^จำนวนห้องน้ำ/, "") || "-";

      const operationTime =
        document
          .querySelector(
            "div:nth-child(4) > div:nth-child(5) > p:nth-child(2)"
          )
          ?.textContent.trim() || "-";

      const transportation =
        document.querySelector("div.my-2 div.prose.mt-2 p")?.textContent.trim() ||
        "-";

      const vendorNotes =
        document
          .querySelector("div:nth-child(4) > div:nth-child(7) > div")
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

// ฟังก์ชันเพื่อดึงข้อมูลแผงว่าง
async function fetchEmptyPanels(pageInstance) {
  // ฟังก์ชันเพื่อรับจำนวนหน้าทั้งหมด
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
          panel
            .querySelector(
              "div:nth-child(3) p.line-clamp-1.text-xs.text-text-value"
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

    // คลิกหน้าถัดไปถ้าไม่ใช่หน้าสุดท้าย
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

// ฟังก์ชันเพื่อแทรกข้อมูลลงในฐานข้อมูล
async function insertMarketData(pool, market) {
  let transaction;
  try {
    // เริ่มทรานแซคชัน
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // แทรกข้อมูลลงในตาราง Market
    const marketInsert = await transaction.request()
      .input("MarketName", sql.NVarChar(255), market.marketName)
      .input("MarketRating", sql.NVarChar(50), market.marketRating)
      .input("MarketAddress", sql.NVarChar(255), market.marketAddress)
      .input("MarketPrice", sql.NVarChar(50), market.marketPrice)
      .input("UrlImageProfile", sql.NVarChar(255), market.urlimageProfile)
      .input("LinkDetail", sql.NVarChar(255), market.linkDetail)
      .query(`
        INSERT INTO Market (MarketName, MarketRating, MarketAddress, MarketPrice, UrlImageProfile, LinkDetail)
        OUTPUT INSERTED.MarketId
        VALUES (@MarketName, @MarketRating, @MarketAddress, @MarketPrice, @UrlImageProfile, @LinkDetail)
      `);

    const MarketId = marketInsert.recordset[0].MarketId;

    // แทรกข้อมูลลงในตาราง DetailMarket
    for (const detail of market.detailMarket) {
      const detailMarketInsert = await transaction.request()
        .input("MarketId", sql.Int, MarketId)
        .input("MarketDetail", sql.NVarChar(255), detail.marketDetail)
        .input("RatingDetail", sql.NVarChar(50), detail.ratingDetail)
        .input("AddressDetail", sql.NVarChar(255), detail.addressDetail)
        .input("GoogleMapLink", sql.NVarChar(255), detail.googleMapLink)
        .query(`
          INSERT INTO DetailMarket (MarketId, MarketDetail, RatingDetail, AddressDetail, GoogleMapLink)
          OUTPUT INSERTED.DetailMarketId
          VALUES (@MarketId, @MarketDetail, @RatingDetail, @AddressDetail, @GoogleMapLink)
        `);

      const DetailMarketId = detailMarketInsert.recordset[0].DetailMarketId;

      // แทรกข้อมูลลงในตาราง TypeOfSh
      for (const shopType of detail.typeOfShops) {
        await transaction.request()
          .input("DetailMarketId", sql.Int, DetailMarketId)
          .input("TypeOfShop", sql.NVarChar(255), shopType)
          .query(`
            INSERT INTO TypeOfSh (DetailMarketId, TypeOfShop)
            VALUES (@DetailMarketId, @TypeOfShop)
          `);
      }

      // แทรกข้อมูลลงในตาราง MarketHighlights
      for (const highlight of detail.marketHighlights) {
        await transaction.request()
          .input("DetailMarketId", sql.Int, DetailMarketId)
          .input("Highlight", sql.NVarChar(255), highlight)
          .query(`
            INSERT INTO MarketHighlights (DetailMarketId, Highlight)
            VALUES (@DetailMarketId, @Highlight)
          `);
      }

      // แทรกข้อมูลลงในตาราง AdditionalInfo
      const addInfo = detail.additionalInfo;

      // จำกัดความยาวของข้อมูลถ้าจำเป็น
      const maxTextLength = 1000000; // ปรับตามความเหมาะสม
      addInfo.transportation = addInfo.transportation.slice(0, maxTextLength);
      addInfo.vendorNotes = addInfo.vendorNotes.slice(0, maxTextLength);

      await transaction.request()
        .input("DetailMarketId", sql.Int, DetailMarketId)
        .input("PriceRange", sql.NVarChar(50), addInfo.priceRange)
        .input("AreaSize", sql.NVarChar(50), addInfo.areaSize)
        .input("AvailableSpaces", sql.NVarChar(50), addInfo.availableSpaces)
        .input("ParkingSpots", sql.NVarChar(50), addInfo.parkingSpots)
        .input("Toilets", sql.NVarChar(50), addInfo.toilets)
        .input("OperationTime", sql.NVarChar(255), addInfo.operationTime)
        .input("Transportation", sql.NVarChar("max"), addInfo.transportation)
        .input("VendorNotes", sql.NVarChar("max"), addInfo.vendorNotes)
        .query(`
          INSERT INTO AdditionalInfo (DetailMarketId, PriceRange, AreaSize, AvailableSpaces, ParkingSpots, Toilets, OperationTime, Transportation, VendorNotes)
          VALUES (@DetailMarketId, @PriceRange, @AreaSize, @AvailableSpaces, @ParkingSpots, @Toilets, @OperationTime, @Transportation, @VendorNotes)
        `);

      // แทรกข้อมูลลงในตาราง DetailMarketTextContent
      for (const textContent of detail.detailMarket.textContent) {
        const limitedTextContent = textContent.slice(0, maxTextLength); // จำกัดความยาวถ้าจำเป็น
        await transaction.request()
          .input("DetailMarketId", sql.Int, DetailMarketId)
          .input("TextContent", sql.NVarChar("max"), limitedTextContent)
          .query(`
            INSERT INTO DetailMarketTextTextContent (DetailMarketId, TextContent)
            VALUES (@DetailMarketId, @TextContent)
          `);
      }

      // แทรกภาพจาก detailMarket.imageSrcs
      for (const imageUrl of detail.detailMarket.imageSrcs) {
        const limitedImageUrl = imageUrl.slice(0, 1000); // ปรับตามความเหมาะสม
        await transaction.request()
          .input("DetailMarketId", sql.Int, DetailMarketId)
          .input("ImageUrl", sql.NVarChar(1000), limitedImageUrl)
          .query(`
            INSERT INTO ImageMarket (DetailMarketId, ImageUrl)
            VALUES (@DetailMarketId, @ImageUrl)
          `);
      }

      // แทรกข้อมูลลงในตาราง NearbyPlaces
      for (const place of detail.nearbyPlaces) {
        await transaction.request()
          .input("DetailMarketId", sql.Int, DetailMarketId)
          .input("NearbyPlace", sql.NVarChar(255), place)
          .query(`
            INSERT INTO NearbyPlaces (DetailMarketId, NearbyPlace)
            VALUES (@DetailMarketId, @NearbyPlace)
          `);
      }

      // แทรกข้อมูลลงในตาราง MarketContract
      const contract = detail.marketContract;
      await transaction.request()
        .input("DetailMarketId", sql.Int, DetailMarketId)
        .input("ContractPrice", sql.NVarChar(50), contract.startPrice)
        .input("Note", sql.NVarChar("max"), contract.note)
        .input("InitialCost", sql.NVarChar(50), contract.initialCost)
        .input("InsurancePremium", sql.NVarChar(50), contract.insurancePremium)
        .input("AdvanceRent", sql.NVarChar(50), contract.advanceRent)
        .input("WaterFee", sql.NVarChar(50), contract.waterFee)
        .input("ElectricityBill", sql.NVarChar(50), contract.electricityBill)
        .input("OtherExpenses", sql.NVarChar(50), contract.otherExpenses)
        .input("Total", sql.NVarChar(50), contract.total)
        .query(`
          INSERT INTO MarketContract (DetailMarketId, ContractPrice, Note, InitialCost, InsurancePremium, AdvanceRent, WaterFee, ElectricityBill, OtherExpenses, Total)
          VALUES (@DetailMarketId, @ContractPrice, @Note, @InitialCost, @InsurancePremium, @AdvanceRent, @WaterFee, @ElectricityBill, @OtherExpenses, @Total)
        `);

      // แทรกภาพจาก detail.imageMarket
      for (const imageUrl of detail.imageMarket) {
        const limitedImageUrl = imageUrl.slice(0, 1000); // ปรับตามความเหมาะสม
        await transaction.request()
          .input("DetailMarketId", sql.Int, DetailMarketId)
          .input("ImageUrl", sql.NVarChar(1000), limitedImageUrl)
          .query(`
            INSERT INTO ImageMarket (DetailMarketId, ImageUrl)
            VALUES (@DetailMarketId, @ImageUrl)
          `);
      }
    }

    // แทรกข้อมูล EmptyPanel
    if (market.Emptypanel && market.Emptypanel.length > 0) {
      for (const panel of market.Emptypanel) {
        await transaction.request()
          .input("MarketId", sql.Int, MarketId)
          .input("StallNumber", sql.NVarChar(255), panel.stallNumber)
          .input("Zone", sql.NVarChar(255), panel.zone)
          .input("AreaType", sql.NVarChar(255), panel.areaType)
          .input("Size", sql.NVarChar(50), panel.size)
          .input("Price", sql.NVarChar(50), panel.price)
          .input("DiscountText", sql.NVarChar(255), panel.discountText)
          .input("OriginalPrice", sql.NVarChar(50), panel.originalPrice)
          .input("DiscountedPrice", sql.NVarChar(50), panel.discountedPrice)
          .input("ImageUrl", sql.NVarChar(1000), panel.imageUrl)
          .query(`
            INSERT INTO EmptyPanel (MarketId, StallNumber, Zone, AreaType, Size, Price, DiscountText, OriginalPrice, DiscountedPrice, ImageUrl)
            VALUES (@MarketId, @StallNumber, @Zone, @AreaType, @Size, @Price, @DiscountText, @OriginalPrice, @DiscountedPrice, @ImageUrl)
          `);
      }
    }

    // ยืนยันทรานแซคชัน
    await transaction.commit();
  } catch (error) {
    console.error(`Error inserting data for market ${market.marketName}:`, error);
    // ยกเลิกทรานแซคชันถ้ามีข้อผิดพลาด
    if (transaction) {
      await transaction.rollback();
    }
  }
}

// เริ่มรันสคริปต์ด้วยจำนวนหน้าที่ต้องการ
const maxPages = 1;
fetchMarkets(maxPages);
