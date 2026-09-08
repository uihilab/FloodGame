const { chromium } = require('playwright');
const path = require('path');

async function test() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1470, height: 900 } });
    const page = await context.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('Uncaught')) {
            console.log('[BROWSER ERROR]', msg.text());
        }
    });

    console.log('Navigating to game...');
    await page.goto('http://localhost:3005/?v=' + Date.now());
    await page.waitForTimeout(4000);

    // Click Greenville map
    const mapCard = page.locator('.map-card').first();
    await mapCard.waitFor({ state: 'visible', timeout: 10000 });
    await mapCard.click();
    console.log('Map clicked, waiting for 3D world to initialize...');

    // Wait until startGame finishes and scene / surfaceTiles are ready
    await page.waitForFunction(() => {
        return window.totalAvailableMoney !== undefined && typeof window.selectTile === 'function';
    }, { timeout: 25000 });

    console.log('Game initialized! Starting tests...');

    const result = await page.evaluate(async () => {
        const tests = [];

        // 1. Find a residential building tile (e.g. Res1)
        let bldR = -1, bldC = -1, bldType = null;
        for (let r = 0; r < 50; r++) {
            for (let c = 0; c < 50; c++) {
                if (window.isBuildingStructure(r, c)) {
                    bldR = r;
                    bldC = c;
                    bldType = window.surfaceTiles[r][c].type;
                    break;
                }
            }
            if (bldR !== -1) break;
        }

        tests.push({ step: 'Find building', bldR, bldC, bldType });

        // Select the building tile
        window.selectTile(bldR, bldC);
        window.updateTileOptions(bldR, bldC);
        window.updateTileInformationPanel();

        const initialBudget = window.totalAvailableMoney;
        const insCost = window.getFloodInsuranceCost(bldType);
        tests.push({ step: 'Initial budget & insurance cost', initialBudget, insCost });

        // Test 1: Check Flood Insurance
        const insCheckbox = document.querySelectorAll('.mitigation-option')[4].querySelector('input[type="checkbox"]');
        insCheckbox.checked = true;
        insCheckbox.dispatchEvent(new Event('click'));

        const budgetAfterIns = window.totalAvailableMoney;
        const isInsuredOnSurface = window.surfaceTiles[bldR][bldC].floodInsurance;
        const hasMit4 = window.hasMitigationType(bldR, bldC, 4);
        const insBadgeExists = !!(window.defenseVisualMeshes && window.defenseVisualMeshes[`insurance_${bldR}_${bldC}`]);

        tests.push({
            step: 'Apply Flood Insurance',
            budgetAfterIns,
            expectedBudget: initialBudget - insCost,
            budgetCorrect: budgetAfterIns === initialBudget - insCost,
            isInsuredOnSurface,
            hasMit4,
            insBadgeExists
        });

        // Test 2: Re-select tile to ensure checkbox status persists
        window.selectTile(bldR, bldC);
        window.updateTileOptions(bldR, bldC);
        const checkboxStillChecked = document.querySelectorAll('.mitigation-option')[4].querySelector('input[type="checkbox"]').checked;
        tests.push({ step: 'Persistence check', checkboxStillChecked });

        // Test 3: Uncheck Flood Insurance to verify refund
        insCheckbox.checked = false;
        insCheckbox.dispatchEvent(new Event('click'));
        const budgetAfterRefund = window.totalAvailableMoney;
        const isInsuredAfterRefund = window.surfaceTiles[bldR][bldC].floodInsurance;
        const badgeRemoved = !window.defenseVisualMeshes[`insurance_${bldR}_${bldC}`];

        tests.push({
            step: 'Refund Flood Insurance',
            budgetAfterRefund,
            refundCorrect: budgetAfterRefund === initialBudget,
            isInsuredAfterRefund,
            badgeRemoved
        });

        // Test 4: Change Tile
        // Select an empty tile or non-water tile
        let emptyR = 15, emptyC = 15;
        window.selectTile(emptyR, emptyC);
        window.updateTileOptions(emptyR, emptyC);

        const budgetBeforeChange = window.totalAvailableMoney;
        const changeSelect = document.querySelectorAll('.mitigation-option')[1].querySelector('select');
        changeSelect.value = 'w1'; // Water
        changeSelect.dispatchEvent(new Event('change'));

        const changeCost = window.getChangeTileCost('w1');
        const changeCheckbox = document.querySelectorAll('.mitigation-option')[1].querySelector('input[type="checkbox"]');
        changeCheckbox.checked = true;
        changeCheckbox.dispatchEvent(new Event('click'));

        const budgetAfterChange = window.totalAvailableMoney;
        const newGroundType = window.groundTiles[emptyR][emptyC].type;

        tests.push({
            step: 'Change Tile to Water',
            budgetBeforeChange,
            changeCost,
            budgetAfterChange,
            expectedBudgetChange: budgetBeforeChange - changeCost,
            changeBudgetCorrect: budgetAfterChange === budgetBeforeChange - changeCost,
            newGroundType
        });

        return tests;
    });

    console.log('Test Results:\n', JSON.stringify(result, null, 2));

    // Re-apply insurance to building and change tile for visual screenshot verification
    await page.evaluate(() => {
        let bldR = -1, bldC = -1;
        for (let r = 0; r < 50; r++) {
            for (let c = 0; c < 50; c++) {
                if (window.isBuildingStructure(r, c)) {
                    bldR = r; bldC = c; break;
                }
            }
            if (bldR !== -1) break;
        }
        window.selectTile(bldR, bldC);
        const insCheckbox = document.querySelectorAll('.mitigation-option')[4].querySelector('input[type="checkbox"]');
        insCheckbox.checked = true;
        insCheckbox.dispatchEvent(new Event('click'));

        // Center camera near building
        const [x, z] = window.calculatePosition(bldR, bldC);
        window.camera.position.set(x + 120, 140, z + 120);
        window.camera.lookAt(x, 20, z);
        if (window.cameraControls) {
            window.cameraControls.target.set(x, 20, z);
        }
    });

    await page.waitForTimeout(1000);
    const screenshotPath = path.join('/Users/campbellendries/.gemini/antigravity-ide/brain/fc4b3233-31b0-47ca-ad27-21c85be799dd', 'insurance_and_changetile_verified.png');
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot saved to', screenshotPath);

    await browser.close();
}

test().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
