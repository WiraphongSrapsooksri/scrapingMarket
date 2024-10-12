const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.xn--l3cb2cwa9ac.com/market';

axios.get(url)
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const markets = [];

    $('.elementor-post').each((index, element) => {
      const title = $(element).find('.elementor-post__title').text().trim();
      const link = $(element).find('.elementor-post__thumbnail__link').attr('href');
      const description = $(element).find('.elementor-post__excerpt p').text().trim();
      markets.push({ title, link, description });
    });

    console.log(markets);
  })
  .catch(console.error);
