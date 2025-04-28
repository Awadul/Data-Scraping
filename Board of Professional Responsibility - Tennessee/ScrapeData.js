// Tennessee Attorney Scraper with Batch Download (500 records per file)
// Paste this entire code into your browser's console and press Enter

(async function () {
    // Configuration
    const config = {
        maxRetries: 3,
        minDelay: 1000,    // 1 second
        maxDelay: 5000,    // 5 seconds
        errorDelayMin: 5000, // 5 seconds
        errorDelayMax: 7000, // 7 seconds
        timeout: 30000,    // 30 seconds
        batchSize: 500     // Records per file
    };

    // Sample BPR numbers - replace with your full list
    const bprNumbers = [];

    // Results storage
    let allResults = [];
    let currentBatch = [];
    let batchNumber = 1;
    let failedRequests = [];

    // Helper function to download data
    function downloadData(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Helper function to process and download batch
    function processBatch(batchData, batchNum) {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const filename = `attorney_data_batch${batchNum}_${timestamp}.json`;

        console.log(`\nDownloading batch ${batchNum} as ${filename}...`);
        downloadData(batchData, filename);

        // Reset for next batch
        currentBatch = [];
        batchNumber++;
    }

    // Helper function for delays
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper function for random delays
    function randomDelay(min, max) {
        return delay(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    // Scrape a single attorney
    async function scrapeAttorney(bprNumber, attempt = 1) {
        const url = `https://www.tbpr.org/attorneys/${bprNumber.toString().padStart(6, '0')}`;

        try {
            // Add delay for retries
            if (attempt > 1) {
                console.log(`Retry #${attempt - 1} for BPR ${bprNumber}...`);
                await randomDelay(config.errorDelayMin, config.errorDelayMax);
            }

            // Fetch the page
            console.log(`Fetching BPR ${bprNumber}...`);
            const response = await fetch(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract data
            const attorneyData = {
                BPR_Number: bprNumber.toString().padStart(6, '0'),
                URL: url
            };

            // Extract details from dl element
            const dl = doc.querySelector('section.content dl');
            if (dl) {
                const dts = dl.querySelectorAll('dt');
                const dds = dl.querySelectorAll('dd');

                dts.forEach((dt, i) => {
                    const key = dt.textContent.trim().replace(':', '');
                    let value = dds[i].textContent.trim();

                    // Handle Status with modal
                    if (key === 'Status') {
                        const modalDiv = dds[i].querySelector('div.js-btn');
                        if (modalDiv) {
                            value = modalDiv.textContent.trim();
                        }
                    }

                    attorneyData[key] = value;
                });
            }

            // Extract public information
            const sections = doc.querySelectorAll('section.content');
            if (sections.length > 1) {
                const publicInfoSection = sections[1];
                const h3 = publicInfoSection.querySelector('h3');
                if (h3 && h3.textContent.includes('Public Information')) {
                    const strong = publicInfoSection.querySelector('strong');
                    if (strong) {
                        attorneyData.Public_Information = strong.textContent.trim();
                    }
                }
            }

            // Extract disciplinary information
            if (sections.length > 2) {
                const disciplineSection = sections[2];
                const h3 = disciplineSection.querySelector('h3');
                if (h3 && h3.textContent.includes('Public Discipline')) {
                    const strong = disciplineSection.querySelector('strong');
                    if (strong) {
                        attorneyData.Public_Discipline = strong.textContent.trim();
                    }
                }
            }

            // Extract names used
            if (sections.length > 3) {
                const namesSection = sections[3];
                const h3 = namesSection.querySelector('h3');
                if (h3 && h3.textContent.includes('Names Used')) {
                    const table = namesSection.querySelector('table');
                    if (table) {
                        const names = Array.from(table.querySelectorAll('td')).map(td => td.textContent.trim());
                        attorneyData.Names_Used = names;
                    }
                }
            }

            // Extract last updated
            const lastUpdated = doc.querySelector('section.content p');
            if (lastUpdated) {
                attorneyData.Last_Updated = lastUpdated.textContent.trim();
            }

            return attorneyData;

        } catch (error) {
            if (attempt < config.maxRetries) {
                return scrapeAttorney(bprNumber, attempt + 1);
            } else {
                console.error(`Failed to fetch BPR ${bprNumber} after ${config.maxRetries} attempts:`, error);
                return {
                    BPR_Number: bprNumber.toString().padStart(6, '0'),
                    URL: url,
                    Error: error.message,
                    Attempts: attempt
                };
            }
        }
    }

    // Main scraping process
    console.log('=== Tennessee Attorney Scraper ===');
    console.log(`Scraping ${bprNumbers.length} attorneys in batches of ${config.batchSize}...`);
    console.log('----------------------------------');

    for (let i = 0; i < bprNumbers.length; i++) {
        const bprNumber = bprNumbers[i];

        // Add random delay between requests
        if (i > 0) {
            await randomDelay(config.minDelay, config.maxDelay);
        }

        const result = await scrapeAttorney(bprNumber);
        allResults.push(result);
        currentBatch.push(result);

        // Check if batch is complete
        if (currentBatch.length >= config.batchSize || i === bprNumbers.length - 1) {
            processBatch(currentBatch, batchNumber);
        }

        // Update progress
        const successCount = allResults.filter(r => !r.Error).length;
        const failCount = allResults.length - successCount;
        const progress = Math.round((i + 1) / bprNumbers.length * 100);

        console.log(`[${progress}%] BPR ${bprNumber}: ${result.Error ? 'FAILED' : 'SUCCESS'} | Success: ${successCount} | Failed: ${failCount} | Batch: ${batchNumber}`);

        if (result.Error) {
            failedRequests.push(bprNumber);
        }
    }

    // Retry failed requests
    if (failedRequests.length > 0) {
        console.log('\n----------------------------------');
        console.log(`Retrying ${failedRequests.length} failed requests...`);
        console.log('----------------------------------');

        const retryResults = [];

        for (let i = 0; i < failedRequests.length; i++) {
            const bprNumber = failedRequests[i];

            // Add random delay between retries
            if (i > 0) {
                await randomDelay(config.errorDelayMin, config.errorDelayMax);
            }

            const result = await scrapeAttorney(bprNumber);
            retryResults.push(result);
            currentBatch.push(result);

            // Check if batch is complete
            if (currentBatch.length >= config.batchSize || i === failedRequests.length - 1) {
                processBatch(currentBatch, batchNumber);
            }

            // Update progress
            const successCount = allResults.filter(r => !r.Error).length +
                retryResults.filter(r => !r.Error).length;
            const failCount = (allResults.length + retryResults.length) - successCount;
            const progress = Math.round((i + 1) / failedRequests.length * 100);

            console.log(`[${progress}%] RETRY BPR ${bprNumber}: ${result.Error ? 'FAILED' : 'SUCCESS'} | Success: ${successCount} | Failed: ${failCount} | Batch: ${batchNumber}`);
        }

        // Update the original results with retry data
        retryResults.forEach(retryResult => {
            const index = allResults.findIndex(r => r.BPR_Number === retryResult.BPR_Number);
            if (index !== -1) {
                allResults[index] = retryResult;
            }
        });
    }

    // Final output
    console.log('\n=== SCRAPING COMPLETE ===');
    console.log(`Total successfully scraped: ${allResults.filter(r => !r.Error).length}`);
    console.log(`Total failed: ${allResults.filter(r => r.Error).length}`);
    console.log(`Downloaded ${batchNumber - 1} batch files`);
    console.log('\nAll batches have been downloaded automatically!');

    // Make the complete results available in console too
    window.allResults = allResults;
})();