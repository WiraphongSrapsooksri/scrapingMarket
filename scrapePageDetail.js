const axios = require("axios");
const cheerio = require("cheerio");

async function fetchMarketDetails(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $("h1.elementor-heading-title").first().text().trim();

    const description = $(".elementor-widget-text-editor p")
      .first()
      .text()
      .trim();

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

    const location = $(
      "#content > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-24ac1475.elementor-section-content-middle.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div.elementor-container.elementor-column-gap-no > div > div > section.elementor-section.elementor-inner-section.elementor-element.elementor-element-79ef50d.elementor-hidden-desktop.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div > div.elementor-element.elementor-element-d9f4186.elementor-widget.elementor-widget-text-editor > div > p > span"
    )
      .text()
      .trim();

    const facebookLink = $(
      '.elementor-widget-text-editor a[href*="facebook"]'
    ).attr("href");

    const additionalInfo = [];
    $(".elementor-widget-text-editor ul li").each((i, element) => {
      additionalInfo.push($(element).text().trim());
    });

    return {
      title,

      description,
      rentalCostStart,
      location,
      facebookLink,
      additionalInfo,
    };
  } catch (error) {
    console.error("Error fetching individual market details:", error);
    return null;
  }
}

const marketLinks = [
  "https://www.xn--l3cb2cwa9ac.com/central/bangkok/plern-dee",
  "https://www.xn--l3cb2cwa9ac.com/central/pathum-thani/%e0%b8%95%e0%b8%a5%e0%b8%b2%e0%b8%94%e0%b8%aa%e0%b8%b5%e0%b9%88%e0%b8%a1%e0%b8%b8%e0%b8%a1%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87/",
  // Add more URLs as needed
];

async function scrapeMarkets() {
  const marketDetailsPromises = marketLinks.map((link) =>
    fetchMarketDetails(link)
  );
  const markets = await Promise.all(marketDetailsPromises);
  console.log(markets.filter((market) => market !== null));
}

scrapeMarkets();
