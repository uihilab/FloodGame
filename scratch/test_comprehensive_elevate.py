import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1600, 'height': 900})
    page.goto('http://localhost:3005/')
    page.wait_for_function('() => typeof window.startGame === "function"')
    page.evaluate('() => { window.startGame([0, "des_moines", 1]); }')
    page.wait_for_function('() => typeof window.debugElevate === "object" && window.debugElevate !== null', timeout=15000)
    page.wait_for_timeout(3000)

    # Dismiss modals
    page.evaluate('''() => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('is-active'));
        const overlay = document.getElementById('sim-loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }''')

    # Run comprehensive tests on Hotel, Com2, and Res1
    test_results = page.evaluate('''() => {
        const dbg = window.debugElevate;
        const allCheckbox = document.querySelectorAll(".mitigation-option [type='checkbox']");
        const elevateCb = allCheckbox[7];
        const elevateSlider = document.querySelectorAll("[type='range']")[0];
        const costText = document.querySelectorAll(".mitigation-option .mitigation-cost")[7];

        const out = {};

        // Find Res1 tile
        let resR = -1, resC = -1;
        for (let r = 0; r < 50; r++) {
            for (let c = 0; c < 50; c++) {
                if (dbg.surfaceTiles[r][c] && dbg.surfaceTiles[r][c].type === 'Res1') {
                    resR = r; resC = c;
                    break;
                }
            }
            if (resR !== -1) break;
        }

        // TEST 1: Hotel at (4, 7)
        dbg.selectedTile.row = 4;
        dbg.selectedTile.column = 7;
        dbg.selectedTile.isSelected = true;

        const initMoney1 = window.totalAvailableMoney;
        elevateSlider.value = 6;
        elevateSlider.dispatchEvent(new Event('input'));
        const previewCostHtl = costText.textContent;
        elevateCb.click();

        const htlMoneyAfterCheck = window.totalAvailableMoney;
        const htlTile = dbg.surfaceTiles[4][7];
        const htlMesh = dbg.meshDict['Htl'];
        const matHtl = new THREE.Matrix4();
        htlMesh.getMatrixAt(htlTile.instanceId, matHtl);
        const posHtl = new THREE.Vector3();
        matHtl.decompose(posHtl, new THREE.Quaternion(), new THREE.Vector3());
        const stiltHtl = dbg.scene.getObjectByName('elevatestructure_4_7');

        // Uncheck Hotel
        elevateCb.click();
        const htlRefundMoney = window.totalAvailableMoney;
        const stiltHtlAfter = dbg.scene.getObjectByName('elevatestructure_4_7');

        out['Hotel'] = {
            previewCost: previewCostHtl,
            costDeducted: initMoney1 - htlMoneyAfterCheck,
            expectedCost: 420000,
            elevatedPosY: posHtl.y,
            expectedPosY: dbg.groundTiles[4][7].elevation + 0.5 + 6 * 7.5,
            stiltFound: !!stiltHtl,
            refundCorrect: (htlRefundMoney === initMoney1),
            stiltCleanedUp: !stiltHtlAfter
        };

        // TEST 2: Commercial 2 at (0, 13)
        dbg.selectedTile.row = 0;
        dbg.selectedTile.column = 13;
        dbg.selectedTile.isSelected = true;

        const initMoney2 = window.totalAvailableMoney;
        elevateSlider.value = 8;
        elevateSlider.dispatchEvent(new Event('input'));
        const previewCostCom2 = costText.textContent;
        elevateCb.click();

        const com2MoneyAfterCheck = window.totalAvailableMoney;
        const com2Tile = dbg.surfaceTiles[0][13];
        const com2Mesh = dbg.meshDict['Com2'];
        const matCom2 = new THREE.Matrix4();
        com2Mesh.getMatrixAt(com2Tile.instanceId, matCom2);
        const posCom2 = new THREE.Vector3();
        matCom2.decompose(posCom2, new THREE.Quaternion(), new THREE.Vector3());
        const stiltCom2 = dbg.scene.getObjectByName('elevatestructure_0_13');

        // Uncheck Com2
        elevateCb.click();
        const com2RefundMoney = window.totalAvailableMoney;
        const stiltCom2After = dbg.scene.getObjectByName('elevatestructure_0_13');

        out['Com2'] = {
            previewCost: previewCostCom2,
            costDeducted: initMoney2 - com2MoneyAfterCheck,
            expectedCost: 450000,
            elevatedPosY: posCom2.y,
            expectedPosY: dbg.groundTiles[0][13].elevation + 0.5 + 8 * 7.5,
            stiltFound: !!stiltCom2,
            refundCorrect: (com2RefundMoney === initMoney2),
            stiltCleanedUp: !stiltCom2After
        };

        // TEST 3: Res1 at (resR, resC)
        dbg.selectedTile.row = resR;
        dbg.selectedTile.column = resC;
        dbg.selectedTile.isSelected = true;

        const initMoney3 = window.totalAvailableMoney;
        elevateSlider.value = 5;
        elevateSlider.dispatchEvent(new Event('input'));
        const previewCostRes = costText.textContent;
        elevateCb.click();

        const resMoneyAfterCheck = window.totalAvailableMoney;
        const resObj = dbg.scene.getObjectByProperty('externalID', resR + '_' + resC);
        const stiltRes = dbg.scene.getObjectByName('elevatestructure_' + resR + '_' + resC);

        // Uncheck Res1
        elevateCb.click();
        const resRefundMoney = window.totalAvailableMoney;
        const stiltResAfter = dbg.scene.getObjectByName('elevatestructure_' + resR + '_' + resC);

        out['Res1'] = {
            location: [resR, resC],
            previewCost: previewCostRes,
            costDeducted: initMoney3 - resMoneyAfterCheck,
            expectedCost: 88000,
            elevatedPosY: resObj ? resObj.position.y : null,
            baseY: resObj ? resObj.userData.baseY : null,
            expectedPosY: resObj ? (resObj.userData.baseY + 5 * 7.5) : null,
            stiltFound: !!stiltRes,
            refundCorrect: (resRefundMoney === initMoney3),
            stiltCleanedUp: !stiltResAfter
        };

        return out;
    }''')

    print('TEST RESULTS:')
    import pprint
    pprint.pprint(test_results)

    # Frame camera looking at Hotel (4, 7)
    page.evaluate('''() => {
        window.testElevate(4, 7, 6);
        const dbg = window.debugElevate;
        // Position camera to look directly at Hotel at (4, 7)
        if (dbg.cameraControls) {
            dbg.cameraControls.setLookAt( 2050 + 60, 70 + 50, -1750 + 60, 2050, 95, -1750, false );
            dbg.cameraControls.zoom(2.0, false);
        }
    }''')
    page.wait_for_timeout(1000)
    page.screenshot(path='/Users/campbellendries/.gemini/antigravity-ide/brain/fc4b3233-31b0-47ca-ad27-21c85be799dd/hotel_perfect_stilts.png')

    # Frame camera looking at Com2 (0, 13)
    page.evaluate('''() => {
        window.testElevate(0, 13, 8);
        const dbg = window.debugElevate;
        if (dbg.cameraControls) {
            dbg.cameraControls.setLookAt( 2450 + 60, 63 + 50, -1150 + 60, 2450, 95, -1150, false );
        }
    }''')
    page.wait_for_timeout(1000)
    page.screenshot(path='/Users/campbellendries/.gemini/antigravity-ide/brain/fc4b3233-31b0-47ca-ad27-21c85be799dd/com2_perfect_stilts.png')

    print('All validations and screenshots complete!')
    browser.close()
