const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchMarkets(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const marketLinks = [];

    // ดึงลิงก์ของตลาดแต่ละแห่งจากหน้าเว็บปัจจุบัน
    $(".elementor-post").each((index, element) => {
      const link = $(element).find(".elementor-post__thumbnail__link").attr("href");
      if (link) marketLinks.push(link);
    });

    

    // กรองข้อมูลที่ไม่ใช่ null และเขียนลงไฟล์ JSON
    const validMarkets = markets.filter((market) => market !== null);
    const jsonData = JSON.stringify(validMarkets, null, 2);

    fs.appendFile("dataMarket.json", jsonData, "utf8", function (err) {
      if (err) {
        console.error("Error writing to file:", err);
      } else {
        console.log("Data saved successfully to dataMarket.json");
      }
    });

    // ตรวจสอบว่ามีลิงก์ไปหน้าถัดไปหรือไม่
    const nextPageLink = $('div.jet-filters-pagination__link:contains("ต่อไป")').parent().attr('href');

    // ถ้ามีหน้าถัดไป เรียก fetchMarkets() ต่อ
    if (nextPageLink) {
      const fullNextPageUrl = new URL(nextPageLink, url).href; // สร้าง URL เต็มจากลิงก์หน้าถัดไป
      console.log(`Fetching next page: ${fullNextPageUrl}`);
      await fetchMarkets(fullNextPageUrl);
    }
  } catch (error) {
    console.error("Error fetching market list:", error);
  }
}

const mainUrl = "https://www.xn--l3cb2cwa9ac.com/market";
fetchMarkets(mainUrl);
