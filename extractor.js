/// EXTRACTOR.JS

async function waitForElement(selector, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            observer.disconnect();
            reject(
                new Error(
                    `Timeout: Elemento "${selector}" não encontrado após ${timeout}ms`
                )
            );
        }, timeout);

        if (document.querySelector(selector)) {
            clearTimeout(timer);
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                clearTimeout(timer);
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

async function extractData() {
    try {
        await waitForElement('div[data-testid="data-column"]');
        const dataView = await waitForElement('div[data-testid="data-view"]');

        const h2Elements = dataView.querySelectorAll("h2");

        let targetH2 = null;
        for (const h2 of h2Elements) {
            if (h2.innerText.toLowerCase().includes("overview")) {
                targetH2 = h2;
                break;
            }
        }

        if (targetH2) {
            const h2OffsetTop = targetH2.offsetTop;
            dataView.scrollTop = h2OffsetTop;
        }

        const h4Elements = dataView.querySelectorAll("h4");

        let targetH4 = null;
        for (const h4 of h4Elements) {
            if (h4.innerText.toLowerCase().includes("overview")) {
                targetH4 = h4;
                break;
            }
        }

        if (targetH4) {
            const h4OffsetTop = targetH4.offsetTop;
            dataView.scrollTop = h4OffsetTop;
        }

        await waitForElement('div[class="ds-listing-agent-header"]');
        await waitForElement('div[class="ds-listing-agent-container"]');
        await waitForElement('ul[class="ds-listing-agent-info"]');

        let tabData = {};

        let buildingAddress = document.querySelector(
            'h2[data-test-id="bdp-building-address"]'
        )?.innerHTML;

        if (!buildingAddress) {
            buildingAddress = document.querySelector(
                'h1[class^="Text-c11n"]'
            )?.innerHTML;
        }

        const [address, city, stateZip] = buildingAddress.split(",");
        const [state, zipcode] = stateZip
            .split(" ")
            .filter((string) => string !== "");

        const listingAgent = document.querySelector(
            'div[class="ds-listing-agent-header"]'
        )?.innerHTML;

        const agentName = document.querySelector(
            'span[class="ds-listing-agent-business-name"]'
        )?.innerHTML;

        tabData["listedBy"] = decodeHtmlEntities(listingAgent);
        tabData["name"] = decodeHtmlEntities(agentName);
        tabData["address"] = decodeHtmlEntities(address.trim());
        tabData["city"] = decodeHtmlEntities(city.trim());
        tabData["state"] = decodeHtmlEntities(state.trim());
        tabData["zipcode"] = decodeHtmlEntities(zipcode.trim());

        return tabData;
    } catch (error) {
        console.error(error);
        return {};
    }
}

function decodeHtmlEntities(html) {
    if (!html) return "";

    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

extractData();
