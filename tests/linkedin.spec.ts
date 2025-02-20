import { test, expect, BrowserContextOptions } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Define interfaces for structured message data
interface Message {
    sender: string;
    text: string;
    timestamp: string;
}

interface Conversation {
    personName: string;
    messages: Message[];
}

test.setTimeout(120000); // Set a 2-minute timeout for the test

// Define paths for session storage
const sessionDir = path.join(__dirname, 'linkedIn-session');
const cookiesPath = path.join(sessionDir, 'cookies.json');
const storageStatePath = path.join(sessionDir, 'storage-state.json');

// Check if session data exists and load it
let sessionValid = false;
let contextOptions: BrowserContextOptions = {};

if (fs.existsSync(storageStatePath)) {
    try {
        const storageStateContent = fs.readFileSync(storageStatePath, 'utf-8');
        if (storageStateContent.trim()) {
            contextOptions.storageState = storageStatePath;
        } else {
            console.log('Storage state file is empty, proceeding without it.');
        }
    } catch (error) {
        console.log('Error reading storage state file:', error);
    }
}

test('LinkedIn Login & Extract Messages', async ({ browser }) => {
    const context = await browser.newContext(contextOptions); // Initialize browser context
    const page = await context.newPage(); // Open a new page

    // Check if session is valid by trying to access the LinkedIn feed
    try {
        await page.goto('https://www.linkedin.com/feed/');
        await page.waitForSelector(
            'a[href="https://www.linkedin.com/messaging/?"]',
            { timeout: 10000 }
        );
        sessionValid = true;
    } catch (error) {
        console.log('Stored session is not valid, logging in again.');
    }

    // If session is invalid, perform login
    if (!sessionValid) {
        await page.goto('https://www.linkedin.com');
        await page.click('[data-test-id="home-hero-sign-in-cta"]'); // Click login button
        await expect(page).toHaveURL('https://www.linkedin.com/login');

        await page.fill('#username', process.env.LINKEDIN_EMAIL || ''); // Enter email
        await page.fill('#password', process.env.LINKEDIN_PASSWORD || ''); // Enter password
        await page.click('button[type="submit"]'); // Click login button

        await page.waitForURL('https://www.linkedin.com/feed/'); // Wait for redirect

        // Save session state
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);
        fs.writeFileSync(
            storageStatePath,
            JSON.stringify(await context.storageState(), null, 2)
        );
        console.log('New session data saved successfully!');
    }

    // Navigate to LinkedIn Messaging
    await page.click('a[href="https://www.linkedin.com/messaging/?"]', {
        timeout: 60000,
    });
    await page.waitForSelector('li.msg-conversation-listitem'); // Wait for conversations to load

    const allConversations: Conversation[] = [];
    let hasMoreConversations = true;
    let previousLength = 0;

    // Extract messages in batches
    while (hasMoreConversations) {
        const conversations = await page.$$('li.msg-conversation-listitem');
        for (let i = 0; i < Math.min(5, conversations.length); i++) {
            try {
                const conversation = conversations[i];
                await conversation.click(); // Open conversation
                await page.waitForSelector('.msg-s-message-list');

                const personName = await conversation.$eval(
                    '.msg-conversation-listitem__participant-names',
                    (el) => el.textContent?.trim() || 'Unknown'
                );
                const messageElements = await page.$$(
                    'li.msg-s-message-list__event'
                );
                const messages: Message[] = [];

                for (const messageElement of messageElements) {
                    const [sender, text, timestamp] = await Promise.all([
                        messageElement.$eval(
                            '.msg-s-message-group__name',
                            (el) => el.textContent?.trim() || 'Unknown'
                        ),
                        messageElement.$eval(
                            '.msg-s-event-listitem__body',
                            (el) => el.textContent?.trim() || ''
                        ),
                        messageElement.$eval(
                            '.msg-s-message-group__timestamp',
                            (el) => el.textContent?.trim() || ''
                        ),
                    ]);
                    if (text) messages.push({ sender, text, timestamp });
                }

                if (messages.length > 0)
                    allConversations.push({ personName, messages });
            } catch (error) {
                console.log('Error processing conversation:', error);
            }
        }

        // Check if new conversations loaded
        const currentConversations = await page.$$(
            'li.msg-conversation-listitem'
        );
        if (currentConversations.length === previousLength)
            hasMoreConversations = false;
        previousLength = currentConversations.length;
    }

    // Save extracted messages
    const conversationsPath = path.join(sessionDir, 'conversations.json');
    fs.writeFileSync(
        conversationsPath,
        JSON.stringify(allConversations, null, 2)
    );
    console.log('Conversations saved successfully!');

    // Save updated session state
    fs.writeFileSync(
        cookiesPath,
        JSON.stringify(await context.cookies(), null, 2)
    );
    fs.writeFileSync(
        storageStatePath,
        JSON.stringify(await context.storageState(), null, 2)
    );
    console.log('Session data updated!');
});
