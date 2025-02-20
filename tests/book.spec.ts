import { test, expect } from '@playwright/test';

test('Book Link', async ({ page }) => {
  // await page.goto('http://books.toscrape.com/');
//   await page
//       .locator('.product_pod')
//       .first()
//       .locator('h3')
//       .click();

//   let title = await page.locator('.product_main').first().locator('h1').innerText();
//   let price = await page
//       .locator('.product_main')
//       .first()
//       .locator('.price_color')
//       .innerText();
//   let description = await page
//       .locator('//div[@id="product_description"]/following-sibling::p')
//       .innerText();

//   console.log("Title - " + title);
//   console.log("Price - " + price);
//   console.log("Description - " + description);

  // const productCount = await page.locator('.product_pod').count();

  // for (let i = 0; i < productCount; i++) {
  //   const title = await page.locator('.product_pod').nth(i).locator('h3').first().locator('a').innerText();
  //   const price = await page
  //       .locator('.product_pod')
  //       .nth(i)
  //       .locator('.product_price')
  //       .first()
  //       .locator('.price_color')
  //       .innerText();
  //   console.log("Title - " + title + ", Price - " + price);
  // }

  // console.log("Product Count - " + productCount);

  await page.goto('https://github.com/TareqImam?tab=repositories');
  const repoCount = await page.locator('.wb-break-all').count();

  for (let i = 0; i < repoCount; i++) {
    await page.locator('.wb-break-all').nth(i).locator('a').click();
  }

  console.log("Repo Count - " + repoCount);

  await page.waitForTimeout(5000);
});