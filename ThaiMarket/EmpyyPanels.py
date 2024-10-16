# import requests
# from bs4 import BeautifulSoup
# import json
# import re
# from selenium import webdriver
# from selenium.webdriver.chrome.options import Options
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC
# import time

# def extract_image_url(image_element):
#     if image_element and 'src' in image_element.attrs:
#         image_url = image_element['src']
#         if '?url=' in image_url:
#             image_url = re.search(r'\?url=([^&]+)', image_url)
#             if image_url:
#                 return image_url.group(1)
#     return ''

# def parse_thaimarket_available_stalls(html_content):
#     soup = BeautifulSoup(html_content, 'html.parser')
    
#     panel_elements = soup.select('div.flex.flex-row.rounded-md.border.border-card-border')
    
#     empty_panels = []
    
#     for panel in panel_elements:
#         image_url = extract_image_url(panel.select_one('img'))
        
#         stall_number = panel.select_one('p.text-xl.text-secondary-500')
#         stall_number = stall_number.text.strip() if stall_number else ''
        
#         zone = panel.select_one('div.m-1.flex.flex-row.lg\\:m-0.md\\:flex-col p')
#         zone = zone.text.strip() if zone else ''
        
#         area_type = panel.select_one('div:nth-child(2) p.ml-2.line-clamp-1.text-xs.text-text-value')
#         area_type = area_type.text.strip() if area_type else ''
        
#         size = panel.select_one('div:nth-child(3) p.ml-2.text-xs.text-text-value')
#         size = size.text.strip() if size else ''
        
#         price = panel.select_one('p.text-xl.font-bold.leading-none')
#         price = price.text.strip() if price else ''
        
#         discount_text = panel.select_one('p.text-xs.text-remark-800')
#         discount_text = discount_text.text.strip() if discount_text else ''
        
#         original_price = panel.select_one('p.md\\:mr-4.text-xs.text-red-500.line-through')
#         original_price = original_price.text.strip() if original_price else ''
        
#         discounted_price = panel.select_one('p.text-xl.font-bold.leading-none')
#         discounted_price = discounted_price.text.strip() if discounted_price else ''
        
#         empty_panels.append({
#             'stallNumber': stall_number,
#             'zone': zone,
#             'areaType': area_type,
#             'size': size,
#             'price': price,
#             'discountText': discount_text,
#             'originalPrice': original_price,
#             'discountedPrice': discounted_price,
#             'imageUrl': image_url
#         })
    
#     return empty_panels

# def scrape_thaimarket_numchai_fair():
#     url = "https://www.thaimarket.biz/markets/ตลาดนำชัยแฟร์-numchai-fair"
    
#     # Set up Selenium WebDriver (make sure you have ChromeDriver installed and in your PATH)
#     chrome_options = Options()
#     chrome_options.add_argument("--headless")  # Run in headless mode
#     driver = webdriver.Chrome(options=chrome_options)
    
#     try:
#         driver.get(url)
        
#         # Wait for the content to load
#         WebDriverWait(driver, 10).until(
#             EC.presence_of_element_located((By.CSS_SELECTOR, "div.flex.flex-row.rounded-md.border.border-card-border"))
#         )
        
#         # Scroll to load all content
#         last_height = driver.execute_script("return document.body.scrollHeight")
#         while True:
#             driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
#             time.sleep(2)
#             new_height = driver.execute_script("return document.body.scrollHeight")
#             if new_height == last_height:
#                 break
#             last_height = new_height
        
#         # Get the page source after JavaScript has loaded the content
#         html_content = driver.page_source
        
#         # Parse the HTML content
#         stalls_data = parse_thaimarket_available_stalls(html_content)
        
#         return stalls_data
    
#     finally:
#         driver.quit()

# # Scrape the data
# stalls_data = scrape_thaimarket_numchai_fair()

# if stalls_data:
#     # Save to JSON file
#     with open('thaimarket_numchai_fair_stalls.json', 'w', encoding='utf-8') as f:
#         json.dump(stalls_data, f, ensure_ascii=False, indent=2)
#     print(f"Data for {len(stalls_data)} available stalls has been scraped and saved to thaimarket_numchai_fair_stalls.json")
# else:
#     print("No data was scraped. Please check the website structure or your internet connection.")

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json

driver = webdriver.Chrome()
driver.get('https://www.thaimarket.biz/markets/ตลาดนำชัยแฟร์-numchai-fair')

wait = WebDriverWait(driver, 10)

# สร้างรายการเพื่อเก็บข้อมูลที่ดึงมา
scraped_data = []

# ฟังก์ชันสำหรับดึงปุ่มการแบ่งหน้า
def get_pagination_buttons():
    pagination_nav = driver.find_element(By.CSS_SELECTOR, 'nav[aria-label="Pagination"]')
    buttons = pagination_nav.find_elements(By.TAG_NAME, 'button')
    return buttons

# เก็บหมายเลขปุ่มที่คลิกไปแล้ว เพื่อป้องกันการคลิกซ้ำ
clicked_buttons = []

# วนลูปจนกว่าจะไม่มีปุ่มให้คลิก
while True:
    buttons = get_pagination_buttons()
    # เก็บข้อความของปุ่มทั้งหมด
    button_texts = [button.text for button in buttons]

    # กรองปุ่มที่ยังไม่ได้คลิก
    unclicked_buttons = [button for button in buttons if button.text not in clicked_buttons]

    if not unclicked_buttons:
        # ถ้าไม่มีปุ่มที่ยังไม่ได้คลิก ออกจากลูป
        break

    for button in unclicked_buttons:
        button_text = button.text
        clicked_buttons.append(button_text)  # เพิ่มในรายการที่คลิกแล้ว

        try:
            # เลื่อนหน้าไปยังปุ่มเพื่อให้แน่ใจว่าสามารถคลิกได้
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", button)
            time.sleep(1)  # รอให้การเลื่อนหน้าสมบูรณ์

            # ใช้ JavaScript ในการคลิกปุ่ม เพื่อหลีกเลี่ยงการถูกซ้อนทับ
            driver.execute_script("arguments[0].click();", button)

            # รอให้เนื้อหาโหลดเสร็จ
            wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'div.rounded-md.border.border-card-border')))

            # ดึงข้อมูลจากรายการ
            list_items = driver.find_elements(By.CSS_SELECTOR, 'div.rounded-md.border.border-card-border')
            for item in list_items:
                try:
                    title = item.find_element(By.CSS_SELECTOR, 'h3').text
                except:
                    title = 'ไม่พบชื่อ'

                try:
                    panel_number = item.find_element(By.CSS_SELECTOR, 'p.text-xl').text
                except:
                    panel_number = 'ไม่พบหมายเลขแผง'

                try:
                    price = item.find_element(By.CSS_SELECTOR, 'p.text-xl.font-bold').text
                except:
                    price = 'ไม่พบราคา'

                # เพิ่มข้อมูลในรายการ
                scraped_data.append({
                    'title': title,
                    'panel_number': panel_number,
                    'price': price
                })

            # หลังจากดึงข้อมูลเสร็จ เราอาจต้องค้นหาปุ่มใหม่ เพราะ DOM อาจเปลี่ยนแปลง
            break  # ออกจากลูป for เพื่ออัปเดตปุ่มใหม่

        except Exception as e:
            print(f"เกิดข้อผิดพลาดในการคลิกปุ่ม {button_text}: {e}")
            continue

# บันทึกข้อมูลที่ดึงมาในไฟล์ JSON
with open('scraped_data.json', 'w', encoding='utf-8') as f:
    json.dump(scraped_data, f, ensure_ascii=False, indent=4)

driver.quit()
