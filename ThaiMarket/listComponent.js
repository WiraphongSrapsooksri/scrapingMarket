const puppeteer = require('puppeteer');

async function fetchEmptyPanels(pageInstance) {
  return await pageInstance.evaluate(() => {

    // ฟังก์ชันในการแปลง URL ของรูปภาพ
    function extractImageUrl(imageElement) {
      let imageUrl = imageElement?.getAttribute('src') || '';
      if (imageUrl.includes('?url=')) {
        imageUrl = decodeURIComponent(imageUrl.split('?url=')[1]?.split('&')[0]);
      }
      return imageUrl;
    }

    const panelElements = document.querySelectorAll('div.flex.flex-row.rounded-md.border.border-card-border');

    const emptyPanels = Array.from(panelElements).map(panel => {
      const imageUrl = extractImageUrl(panel.querySelector('img'));

      const stallNumber = panel.querySelector('p.text-xl.text-secondary-500')?.textContent.trim() || '';
      const zone = panel.querySelector('div.m-1.flex.flex-row.lg\\:m-0.md\\:flex-col p')?.textContent.trim() || '';
      const areaType = panel.querySelector('div:nth-child(2) p.line-clamp-1.text-xs.text-text-value')?.textContent.trim() || '';
      const size = panel.querySelector('div:nth-child(2) p.text-xs.text-text-value')?.textContent.trim() || '';
      const price = panel.querySelector('p.text-xl.font-bold.leading-none')?.textContent.trim() || '';

      const discountText = panel.querySelector('p.text-xs.text-remark-800')?.textContent.trim() || '';
      const originalPrice = panel.querySelector('p.md\\:mr-4.text-xs.text-red-500.line-through')?.textContent.trim() || '';
      const discountedPrice = panel.querySelector('p.text-xl.font-bold.leading-none')?.textContent.trim() || '';

      return {
        stallNumber,
        zone,
        areaType,
        size,  
        price,
        discountText,  
        originalPrice,  
        discountedPrice, 
        imageUrl
      };
    });

    return emptyPanels;
  });
}

(async () => {
    const browser = await puppeteer.launch({ headless: false }); // ตั้งค่า headless: true ถ้าคุณไม่ต้องการเห็นเบราว์เซอร์
    const page = await browser.newPage();
  
    // ไปยังหน้าเว็บที่ต้องการ
    await page.goto('https://www.thaimarket.biz/markets/ตลาดนำชัยแฟร์-numchai-fair');
  
    // รอให้ธาตุที่ต้องการโหลดขึ้นมา
    await page.waitForSelector('div.flex.flex-row.rounded-md.border.border-card-border');
  
    // สร้างอาร์เรย์เพื่อเก็บข้อมูลทั้งหมด
    let allPanels = [];
  
    // หาจำนวนหน้าทั้งหมดจากปุ่มแบ่งหน้า
    const totalPages = await page.evaluate(() => {
      const paginationNav = document.querySelector('nav[aria-label="Pagination"]');
      const buttons = paginationNav.querySelectorAll('button');
      const pageNumbers = Array.from(buttons).map(btn => parseInt(btn.textContent)).filter(num => !isNaN(num));
      return Math.max(...pageNumbers);
    });
  
    // วนลูปผ่านแต่ละหน้า
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      // รอให้ธาตุที่ต้องการโหลดขึ้นมา
      await page.waitForSelector('div.flex.flex-row.rounded-md.border.border-card-border');
  
      // ดึงข้อมูลจากหน้า
      const emptyPanels = await fetchEmptyPanels(page);
      allPanels = allPanels.concat(emptyPanels);
  
      // คลิกปุ่มหน้าถัดไปถ้าไม่ใช่หน้าสุดท้าย
      if (currentPage < totalPages) {
        await page.waitForSelector('nav[aria-label="Pagination"]');
  
        await page.evaluate((currentPage) => {
          const paginationNav = document.querySelector('nav[aria-label="Pagination"]');
          const buttons = Array.from(paginationNav.querySelectorAll('button'));
          const nextPageButton = buttons.find(btn => btn.textContent == (currentPage + 1).toString());
          if (nextPageButton) {
            nextPageButton.click();
          }
        }, currentPage);
  
        // รอให้หน้าโหลด (แก้ไขส่วนนี้)
        // ใช้วิธีที่ 2 แทนเมธอดที่ไม่สามารถใช้งานได้
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  

  
    // บันทึกข้อมูลลงในไฟล์ JSON
    const fs = require('fs');
    fs.writeFileSync('empty_panels.json', JSON.stringify(allPanels, null, 2), 'utf-8');
  
    await browser.close();
  })();
