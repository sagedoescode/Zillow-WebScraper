/// EXTRACTOR.JS

async function waitForElement(selector, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            observer.disconnect();
            reject(
                new Error(
                    `Timeout: Element "${selector}" not found after ${timeout}ms`
                )
            );
        }, timeout);

        const dataView = document.querySelector('div[data-testid="data-view"]');

        const observer = new MutationObserver((mutations) => {
            const element = document.querySelector(selector);
            if (element) {
                clearTimeout(timer);
                observer.disconnect();
                resolve(element);
            } else {
                dataView.scrollTop += 100;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        const element = document.querySelector(selector);
        if (element) {
            clearTimeout(timer);
            observer.disconnect();
            resolve(element);
        }
    });
}

function getAddress() {
    let buildingAddress = document.querySelector(
        'h2[data-test-id="bdp-building-address"]'
    );

    if (!buildingAddress) {
        buildingAddress = document.querySelector('h1[class^="Text-c11n"]');
    }

    if (!buildingAddress) {
        buildingAddress = document.querySelector('h1[class^="Text-c22n"]');
    }

    const addressBtn = buildingAddress.querySelector("button");

    if (addressBtn) {
        const buttonText = addressBtn.innerHTML;
        addressBtn.remove();

        const remainingText = buildingAddress.innerHTML;
        const concatenatedText = `${buttonText} ${remainingText}`;

        buildingAddress = concatenatedText;
    }

    let addressMatch;
    const addressRegex = /([^,]+),\s*([^,]+),\s*([A-Za-z]+)\s*(\d{5})/;

    if (typeof buildingAddress === "string") {
        buildingAddress = buildingAddress.trim();
        addressMatch = buildingAddress.match(addressRegex);
    } else {
        addressMatch = buildingAddress.innerHTML.match(addressRegex);
    }

    return addressMatch;
}

async function extractData() {
    await waitForElement('div[data-testid="data-column"]');
    await waitForElement('div[data-testid="data-view"]');

    let tabData = {};
    const address = getAddress();

    tabData["address"] = decodeHtmlEntities(address[1].trim());
    const unit = decodeHtmlEntities(address[0].trim());

    if (address[1].includes("#")) {
        tabData["address"] = `${address.input.split(",")[0]}`;
    }

    if (unit.includes("#")) {
        tabData["address"] = `${tabData["address"]} ${address.input
            .split(",")[1]
            .trim()}`;
    }

    tabData["city"] = decodeHtmlEntities(
        address[2]
            .trim()
            .replace(/<\/?[^>]+(>|$)/g, "")
            .trim()
    );
    tabData["state"] = decodeHtmlEntities(address[3].trim());
    tabData["zipcode"] = decodeHtmlEntities(address[4].trim());

    try {
        await waitForElement('div[class="ds-listing-agent-header"]');
        await waitForElement('div[class="ds-listing-agent-container"]');
        await waitForElement('ul[class="ds-listing-agent-info"]');

        const listingAgent = document.querySelector(
            'div[class="ds-listing-agent-header"]'
        )?.innerHTML;

        const agentName = document.querySelector(
            'span[class="ds-listing-agent-business-name"]'
        )?.innerHTML;

        tabData["listedBy"] = decodeHtmlEntities(listingAgent);
        tabData["name"] = decodeHtmlEntities(agentName);
    } catch (error) {
        console.error("error on finding agent infos");
        tabData["listedBy"] = "Oops";
        tabData["name"] = "Oops";
    }

    return tabData;
}

function decodeHtmlEntities(html) {
    if (!html) return "";

    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value.trim();
}

extractData();