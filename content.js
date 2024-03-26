let isScraping = false;
let currentPage = 1; // Track the current page

chrome.runtime.onMessage.addListener(function (message) {
    if (message.action === "startScraping") {
        console.log("Received startScraping message");
        isScraping = true;
        currentPage = 1;
        startScraping();
    } else if (message.action === "stopScraping") {
        isScraping = false;
        console.log("Received stopScraping message");
    }
});

async function slowScrollToBottom(total = 0) {
    const items = getItems();
    if (total === items.length) return;
    items[items.length - 2].scrollIntoView({ behavior: "smooth" });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await slowScrollToBottom(items.length);
}

function getItems() {
    const itemsContainer = document.querySelector("#grid-search-results");
    const list = itemsContainer.querySelector("ul");
    return list.querySelectorAll('article[data-test="property-card"]');
}

function scrapeData(elements) {
    let extractedData = [];
    let hrefs = [];

    elements.forEach((element) => {
        const link = element.querySelector("a[property-card-link]") || element.querySelector("a");
        if (link) {
            extractedData.push({ link: link.href });
            hrefs.push(link.href);
        }
    });

    if (hrefs.length > 0) {
        chrome.runtime.sendMessage({ action: "openLink", hrefs: hrefs });
    }
}



async function startScraping() {

    await slowScrollToBottom();
    const items = getItems();
    scrapeData(items);
    const nextPage = await navigateToNextPage();
    if (nextPage) {
        // Wait for the next page to load before starting to scrape again
        setTimeout(startScraping, 3000);
    } else {
        console.log("Scraping completed.");
        // Send a message back to the background script if needed
    }

}

async function navigateToNextPage() {
    await slowScrollToBottom();

    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Target the 'Next' button more precisely
    const nextButton = document.querySelector('.PaginationJumpItem-c11n-8-100-4__sc-h97wcm-0.cDjLHf a[rel="next"]:not([aria-disabled="true"])');

    if (nextButton) {
        nextButton.click();
        // Wait for the page navigation to initiate
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    }
    return false;
}
