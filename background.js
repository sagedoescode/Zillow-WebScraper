/// BACKGROUND.JS
let scrapingWindowId = null;

function startScraping(sendResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            sendResponse({ message: "Error: No active tab found." });
            return;
        }
        const activeTab = tabs[0];
        scrapingWindowId = activeTab.windowId;
        if (!activeTab.id) {
            console.error("Active tab ID is undefined.");
            sendResponse({
                message: "Error: Active tab ID is undefined.",
            });
            return;
        }

        await chrome.tabs.sendMessage(activeTab.id, {
            action: "startScraping",
        });
        await sendResponse({
            message: "Scraping started on tab " + activeTab.id,
        });

    }
    );

    return true;
}


async function openLinks(message, sendResponse) {
    const links = message.hrefs;
    const data = [];
    
    for (const link of links) {
        const newTab = await chrome.tabs.create({ windowId: scrapingWindowId, url: link, active: true });
        try {
            const response = await chrome.scripting.executeScript({
                target: { tabId: newTab.id },
                files: ["extractor.js"],
            });

            if (response[0].result) {
                data.push({
                    ...response[0].result,
                    url: link,
                });
            }
        } catch (error) {
            console.error("Error injecting script:", error);
        } finally {
            // Close the tab after processing, whether it succeeded or failed
            chrome.tabs.remove(newTab.id);
        }
    }

    sendResponse({
        message: `Tabs opened and extractor injected.`,
    });

    scrapedData(data);
}

function stopScraping(sendResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            sendResponse({ message: "Error: No active tab found." });
            return;
        }
        const activeTab = tabs[0];
        if (!activeTab.id) {
            console.error("Active tab ID is undefined.");
            sendResponse({
                message: "Error: Active tab ID is undefined.",
            });
            return;
        }

        chrome.tabs.sendMessage(activeTab.id, {
            action: "stopScraping",
        });
        sendResponse({
            message: "Stop message sent to tab " + activeTab.id,
        });
    });

    return true; // Keeps the message channel open for async sendResponse
    // Handling extracted data from content scripts
}

function scrapedData(data) {
    console.log("Dados:", data);
    chrome.storage.local.set({ extractedData: data }, function () {
        console.log("Dados salvos com sucesso!");
    });
}

function handleScraping(message, sender, sendResponse) {
    if (message.action === "startScraping") {
        console.log("start");
        startScraping(sendResponse);
    }

    if (message.action === "openLink") {
        console.log("open");
        openLinks(message, sendResponse);
    }

    if (message.action === "stopScraping") {
        console.log("stop");
        stopScraping(sendResponse);
    }

    if (message.action === "scrapedData") {
        console.log("scraped");
        scrapedData(message, sendResponse);
    }

    return true; // Always return true to keep the message channel open
}

chrome.runtime.onMessage.addListener(handleScraping);
