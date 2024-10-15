const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function fetchMarketDetails(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    let title = $("h1.elementor-heading-title").first().text().trim();
    if (title === "") {
      title = $(
        "#content > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-179e44a.elementor-section-content-middle.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div.elementor-container.elementor-column-gap-no > div > div > section.elementor-section.elementor-inner-section.elementor-element.elementor-element-ac4ae61.elementor-hidden-desktop.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div > div.elementor-element.elementor-element-00d8199.elementor-widget.elementor-widget-heading > div > h4"
      )
        .text()
        .trim();
    }
    if (title === "") {
      title = $(
        "#content > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-3c03ffc9.elementor-section-content-middle.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div.elementor-container.elementor-column-gap-no > div > div > section.elementor-section.elementor-inner-section.elementor-element.elementor-element-10fcd66.elementor-hidden-desktop.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div > div.elementor-element.elementor-element-c41cedd.elementor-widget.elementor-widget-heading > div > h4"
      )
        .text()
        .trim();
    }
    if (title === "") {
      title = $(
        "#content > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-429ec3cf.elementor-section-content-middle.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div.elementor-container.elementor-column-gap-no > div > div > section.elementor-section.elementor-inner-section.elementor-element.elementor-element-9621e8d.elementor-hidden-desktop.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div > div.elementor-element.elementor-element-aebec8c.elementor-widget.elementor-widget-heading > div > h4"
      )
        .text()
        .trim();
    }
    let description = $(".elementor-widget-text-editor p")
      .first()
      .text()
      .trim();
    if (description === "") {
      description = $(
        "#content > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-218cca59.elementor-section-content-middle.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div.elementor-container.elementor-column-gap-no > div > div > section.elementor-section.elementor-inner-section.elementor-element.elementor-element-289c706b.elementor-hidden-desktop.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div > div.elementor-element.elementor-element-9c6b938.elementor-widget.elementor-widget-text-editor > div"
      )
        .first()
        .text()
        .trim();
    }

    let rentalCostStart = $(
      '.elementor-icon-list-text:contains("ค่าเช่าเริ่มต้น")'
    )
      .text()
      .trim();
    if (rentalCostStart === "") {
      rentalCostStart = $(
        '.elementor-widget-text-editor p:contains("ค่าเช่าเริ่มต้น")'
      )
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim();
    }

    let location = $('.elementor-icon-list-text:contains("สถานที่")')
      .contents()
      .filter(function () {
        return this.nodeType === 3; // ตรวจสอบว่าเป็น text node เพื่อดึงเฉพาะข้อความ
      })
      .text()
      .trim();

    if (location === "") {
      // ถ้าไม่พบข้อมูลในแบบแรก ลองใช้โครงสร้าง HTML อื่นที่อาจเป็นไปได้
      location = $('.elementor-widget-text-editor:contains("สถานที่") p')
        .contents()
        .filter(function () {
          return this.nodeType === 3; // ตรวจสอบว่าเป็น text node
        })
        .text()
        .trim();
    }

    const facebookLink = $(
      '.elementor-widget-text-editor a[href*="facebook"]'
    ).attr("href");
    const additionalInfo = [];
    $(".elementor-widget-text-editor ul li").each((i, element) => {
      additionalInfo.push($(element).text().trim());
    });

    // const  detailsMarket = $('').text().trim();
    // ใช้ jQuery หรือ Cheerio ในการเลือกข้อมูลที่ต้องการ
    let detailText = $('h3:contains("รายละเอียด")')
      .closest(".elementor-widget-heading")
      .next(".elementor-widget-text-editor")
      .text()
      .trim();

    let RentDetatil = $('h2:contains("ค่าเช่า")')
      .closest(".elementor-widget-heading")
      .next(".elementor-widget-text-editor")
      .text()
      .trim();

    let Highlights = $('h3:contains("จุดเด่น")')
      .closest(".elementor-widget-heading")
      .next(".elementor-widget-text-editor")
      .text()
      .trim();

    let mapSrc = $("div.elementor-widget-google_maps iframe").attr(
      "data-lazy-src"
    );

    let locationTitle = $("h2.elementor-heading-title").text().trim();
    if (mapSrc) {
      // ปรับลิงก์ embed ให้เป็นลิงก์ที่เปิดได้ใน Google Maps
      mapSrc = mapSrc.replace("&output=embed", "");
    }

    // let Contact = $('h3:contains("ติดต่อสอบถามข้อมูลหรือเช่าพื้นที่")')
    //   .closest(".elementor-widget-heading")
    //   .next(".elementor-widget-text-editor")
    //   .text()
    //   .trim();

    let contactDetails = $('h3:contains("ติดต่อสอบถามข้อมูลหรือเช่าพื้นที่")')
      .closest(".elementor-widget-container") // ค้นหา parent ที่ใกล้ที่สุด
      .parent() // เลือก parent div ที่เป็นตัว container ทั้งหมดขององค์ประกอบที่ต้องการ
      .next(".elementor-widget-text-editor") // เลือกองค์ประกอบถัดไปที่เป็น .elementor-widget-text-editor
      .find(".elementor-widget-container") // ค้นหา container ที่มีข้อมูล
      .text()
      .trim();

    return {
      title,
      description,
      rentalCostStart,
      location,
      facebookLink,
      additionalInfo,
      RentDetatil,
      detailText,
      Highlights,
      locationTitle,
      mapSrc,
      contactDetails,
    };
  } catch (error) {
    console.error("Error fetching individual market details:", error);
    return null;
  }
}

async function fetchMarkets(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const marketLinks = [];

    $(".elementor-post").each((index, element) => {
      const link = $(element)
        .find(".elementor-post__thumbnail__link")
        .attr("href");
      if (link) marketLinks.push(link);
    });

    const marketDetailsPromises = marketLinks.map((link) =>
      fetchMarketDetails(link)
    );
    const markets = await Promise.all(marketDetailsPromises);

    // Filter out null responses and convert to JSON string
    const validMarkets = markets.filter((market) => market !== null);
    const jsonData = JSON.stringify(validMarkets, null, 2);

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

const mainUrl = "https://www.xn--l3cb2cwa9ac.com/market";
fetchMarkets(mainUrl);
