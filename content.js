/// CONTENT.JS
let isScraping = false;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'startScraping') {
        console.log("Received startScraping message");
        isScraping = true;
        scrollToBottom(() => waitForElements('article[data-test="property-card"]', scrapeData));
    } else if (message.action === 'stopScraping') {
        isScraping = false;
        console.log("Received stopScraping message");
    }
});

function scrollToBottom(callback) {
    let lastHeight = document.body.scrollHeight, newHeight;
    const stepDistance = 100; // The number of pixels to scroll on each step.
    const stepDelay = 20; // The delay in milliseconds between each scroll step.

    function step() {
        window.scrollBy(0, stepDistance); // Scroll down a set distance
        newHeight = document.body.scrollHeight;

        if (window.innerHeight + window.scrollY >= newHeight) {
            if (newHeight !== lastHeight) {
                lastHeight = newHeight;
                setTimeout(step, stepDelay); // Wait for the specified delay before scrolling again
            } else {
                console.log('Reached the bottom and no new content is loading.');
                callback(); // Execute the callback function once no new content is detected
            }
        } else {
            setTimeout(step, stepDelay); // If not at the bottom, continue scrolling
        }
    }

    step(); // Start the scrolling process
}

function waitForElements(selector, callback) {
    if (!isScraping) return;

    console.log("Waiting for elements...");
    const observer = new MutationObserver((mutations, me) => {
        if (!isScraping) {
            me.disconnect();
            return;
        }

        const elements = document.querySelectorAll(selector);
        console.log(`Found ${elements.length} elements.`);
        if (elements.length > 0) {
            me.disconnect(); // Stop observing
            callback(elements);
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
}

function scrapeData(elements) {
    console.log("Scraping data...");
    if (elements.length > 0) {
        console.log(`Total articles found: ${elements.length}`);
        let extractedData = []; // Initialize an array to hold the extracted data
        let hrefs = [];

        elements.forEach(element => {
            console.log(`Current article content: ${element.outerHTML}`);
            const link = element.querySelector('a[property-card-link]');
            if (link) {
                console.log(`Found link: ${link.href}`);
                // Push the scraped data into the array
                extractedData.push({ link: link.href });
                hrefs.push(link.href); // Push the link to the hrefs array
            } else {
                console.log("Attempting to find any 'a' element within the article...");
                const anyLink = element.querySelector('a');
                if (anyLink) {
                    console.log(`Found 'a' element: ${anyLink.outerHTML}`);
                    // Push the scraped data into the array
                    extractedData.push({ link: anyLink.href });
                    hrefs.push(anyLink.href); // Push the link to the hrefs array
                } else {
                    console.log("No 'a' element found within this article.");
                }
            }
        });

        // Send the hrefs to the background script to open links
        if (hrefs.length > 0) {
            chrome.runtime.sendMessage({ action: 'openLinks', hrefs: hrefs, openInactive: true });
        } else {
            console.log("No links found to open.");
        }

        // Send the extracted data to the background script
        chrome.runtime.sendMessage({ action: 'scrapedData', data: extractedData }, () => {
            console.log("Scraped data sent to background script.");
        });
        // In scrapeData function
        chrome.runtime.sendMessage({ action: 'allScrapingDone' });

    } else {
        console.log("No articles found.");
    }
}