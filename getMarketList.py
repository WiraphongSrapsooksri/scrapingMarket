from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup
import json
import time

EDGE_DRIVER_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\msedgedriver.exe'  # Path to Edge WebDriver
service = Service(EDGE_DRIVER_PATH)
options = webdriver.EdgeOptions()
# Remove headless mode for debugging
# options.add_argument("--headless")  # Run in headless mode if needed

BASE_URL = "https://www.xn--l3cb2cwa9ac.com/market"


def get_market_list():
    market_list = []

    driver = webdriver.Edge(service=service, options=options)
    driver.get(BASE_URL)

    while True:
        try:
            # Load the page content with BeautifulSoup
            soup = BeautifulSoup(driver.page_source, 'html.parser')

            # Extract the necessary data
            items = soup.select('.elementor-post')
            for item in items:
                title = item.select_one('.elementor-post__title').get_text(strip=True)
                link = item.select_one('.elementor-post__thumbnail__link')['href']
                excerpt = item.select_one('.elementor-post__excerpt p').get_text(strip=True) if item.select_one('.elementor-post__excerpt p') else ""

                market_list.append({
                    "title": title,
                    "link": link,
                    "excerpt": excerpt
                })

            # Find the "ต่อไป" link to go to the next page
            next_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//a[contains(@class, "dev.jet-filters-pagination__link") and contains(text(), "ต่อไป")]'))
            )
            next_button.click()
            time.sleep(2)  # Optional: wait to avoid overloading the server

        except TimeoutException:
            print("No more pages to load or timeout occurred.")
            break

    driver.quit()
    return market_list


def save_to_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def main():
    market_list = get_market_list()
    save_to_json(market_list, 'market_list.json')
    print(f"Data has been saved to market_list.json")


if __name__ == "__main__":
    main()