/// CONTENT.JS
let isScraping = false;

chrome.runtime.onMessage.addListener(function (message) {
    if (message.action === "startScraping") {
        console.log("Received startScraping message");
        isScraping = true;

        startScraping();
    } else if (message.action === "stopScraping") {
        isScraping = false;
        console.log("Received stopScraping message");
    }
});

function getItems() {
    const itemsContainer = document.querySelector("#grid-search-results");
    const list = itemsContainer.querySelector("ul");
    const items = list.querySelectorAll('article[data-test="property-card"]');

    return items;
}

async function slowScrollToBottom(total = 0) {
    const items = getItems();

    if (total === items.length) {
        return;
    }

    items[items.length - 2].scrollIntoView({ behavior: "smooth" });
    await new Promise((resolve) => setTimeout(resolve, 1200));

    await slowScrollToBottom(items.length);
}

async function startScraping() {
    await slowScrollToBottom();

    const items = getItems();

    scrapeData(items);
}

function scrapeData(elements) {
    console.log("Scraping data...");
    if (elements.length > 0) {
        console.log(`Total articles found: ${elements.length}`);
        let extractedData = []; // Initialize an array to hold the extracted data
        let hrefs = [];

        elements.forEach((element) => {
            // console.log(`Current article content: ${element.outerHTML}`);
            const link = element.querySelector("a[property-card-link]");
            if (link) {
                console.log(`Found link: ${link.href}`);
                // Push the scraped data into the array
                extractedData.push({ link: link.href });
                hrefs.push(link.href); // Push the link to the hrefs array
            } else {
                console.log(
                    "Attempting to find any 'a' element within the article..."
                );
                const anyLink = element.querySelector("a");
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
            chrome.runtime.sendMessage({
                action: "openLink",
                hrefs: hrefs,
            });
        } else {
            console.log("No links found to open.");
        }
    } else {
        console.log("No articles found.");
    }
}
