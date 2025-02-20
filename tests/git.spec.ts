import { test, expect } from '@playwright/test';

test('Git Test', async ({page}) => {
    await page.goto('https://www.github.com');

    await page.locator('.HeaderMenu-link--sign-in').click();

    await page.locator('input[name="login"]').fill('TareqImam');

    await page.locator('input[name="password"]').fill('Bok@cod@990');
    
    await page.locator('input[name="commit"]').click();
    
    await page.waitForTimeout(5000);

    await page.goto('https://www.github.com/logout');

    await page.waitForTimeout(5000);

    await page.locator('input[name="commit"]').first().click();

    await page.waitForTimeout(5000);
});

