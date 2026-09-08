from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1470, "height": 900})
    page.on('console', lambda msg: print(f'CONSOLE: [{msg.type}] {msg.text}') if 'error' in msg.type.lower() or 'Uncaught' in msg.text else None)
    page.on('pageerror', lambda err: print(f'PAGE ERROR: {err}'))

    print('Navigating to http://localhost:3005/ ...')
    page.goto('http://localhost:3005/')

    print('Waiting for window.startGame...')
    page.wait_for_function('() => typeof window.startGame === "function"', timeout=10000)
    page.evaluate('window.startGame([0, "des_moines", 1])')

    print('Waiting for window.debugElevate...')
    page.wait_for_function('() => typeof window.debugElevate === "object" && window.debugElevate !== null', timeout=20000)
    print('Simulation ready!')

    results = page.evaluate('''() => {
        const tests = [];

        // 1. Locate a building tile
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

        // Select building tile
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

        // Get Inspector text for mitigations
        const mitEl = document.getElementById("tile-info-mit");
        const mitText = mitEl ? mitEl.textContent : "";

        tests.push({
            step: 'Apply Flood Insurance',
            budgetAfterIns,
            expectedBudget: initialBudget - insCost,
            budgetCorrect: budgetAfterIns === (initialBudget - insCost),
            isInsuredOnSurface,
            hasMit4,
            insBadgeExists,
            mitText
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
        // Select an empty tile or non-water tile (e.g. 15, 15)
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
            changeBudgetCorrect: budgetAfterChange === (budgetBeforeChange - changeCost),
            newGroundType
        });

        return tests;
    }''')

    print('TEST RESULTS:')
    print(json.dumps(results, indent=2))

    # Re-apply insurance on building so we can take a picture of the badge + inspector panel
    page.evaluate('''() => {
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
        window.updateTileOptions(bldR, bldC);
        const insCheckbox = document.querySelectorAll('.mitigation-option')[4].querySelector('input[type="checkbox"]');
        insCheckbox.checked = true;
        insCheckbox.dispatchEvent(new Event('click'));

        // Hide landing modals and overlays
        document.querySelectorAll('.modal').forEach(el => {
            el.classList.remove('is-active');
            el.style.display = 'none';
        });
        document.querySelectorAll('#starterInfo, #modal-js-example, #gameInstructions, #citySelectionDiv').forEach(el => {
            if (el) {
                el.classList.remove('is-active');
                el.style.display = 'none';
            }
        });

        // Switch to Abilities tab
        const abilitiesTabA = document.querySelector(".hud-tab-btn[data-target='mitigation-options'] a");
        if (abilitiesTabA) {
            abilitiesTabA.click();
        } else if (typeof window.triggerAbilitiesTab === "function") {
            window.triggerAbilitiesTab();
        }

        // Center camera near building
        const x = bldC * 100 - 2450;
        const z = bldR * 100 - 2450;
        const cam = window.debugElevate.camera;
        const ctrl = window.debugElevate.cameraControls;
        if (ctrl) {
            ctrl.setLookAt(x + 120, 100, z + 120, x, 20, z, false);
        } else if (cam) {
            cam.position.set(x + 120, 100, z + 120);
            cam.lookAt(x, 20, z);
        }
    }''')

    page.wait_for_timeout(1500)
    shot_path = '/Users/campbellendries/.gemini/antigravity-ide/brain/fc4b3233-31b0-47ca-ad27-21c85be799dd/insurance_and_changetile_abilities_tab.png'
    page.screenshot(path=shot_path)
    print(f'Screenshot saved to {shot_path}')

    browser.close()
