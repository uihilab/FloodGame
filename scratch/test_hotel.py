from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', lambda msg: print(f'CONSOLE: [{msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: print(f'PAGE ERROR: {err}'))
    page.goto('http://localhost:3005/')

    print('Waiting for window.startGame...')
    page.wait_for_function('() => typeof window.startGame === "function"', timeout=10000)
    print('window.startGame ready, calling startGame...')
    page.evaluate('window.startGame([0, "des_moines", 1])')

    print('Waiting for window.debugElevate...')
    page.wait_for_function('() => typeof window.debugElevate === "object" && window.debugElevate !== null', timeout=15000)
    print('debugElevate is ready!')

    # Check Htl and Com2
    info = page.evaluate('''() => {
        const dbg = window.debugElevate;
        let htl = null, com2 = null;
        for (let r = 0; r < 50; r++) {
            for (let c = 0; c < 50; c++) {
                const t = dbg.surfaceTiles[r][c];
                if (t && t.type === 'Htl' && !htl) htl = { r, c, tile: t };
                if (t && t.type === 'Com2' && !com2) com2 = { r, c, tile: t };
            }
        }
        return { htl, com2 };
    }''')
    print('Found info:', info)

    if info.get('htl'):
        r = info['htl']['r']
        c = info['htl']['c']
        instId = info['htl']['tile']['instanceId']
        res = page.evaluate(f'''() => {{
            const dbg = window.debugElevate;
            const inst = dbg.meshDict['Htl'];
            const mBefore = new THREE.Matrix4();
            inst.getMatrixAt({instId}, mBefore);
            const posBefore = new THREE.Vector3();
            mBefore.decompose(posBefore, new THREE.Quaternion(), new THREE.Vector3());

            window.testElevate({r}, {c}, 6);

            const mAfter = new THREE.Matrix4();
            inst.getMatrixAt({instId}, mAfter);
            const posAfter = new THREE.Vector3();
            mAfter.decompose(posAfter, new THREE.Quaternion(), new THREE.Vector3());

            const stilt = dbg.defenseVisualMeshes['elevatestructure_' + {r} + '_' + {c}];
            return {{
                r: {r}, c: {c}, instId: {instId},
                posBefore: posBefore,
                posAfter: posAfter,
                stiltFound: !!stilt,
                stiltPos: stilt ? stilt.position : null,
                baseY: dbg.surfaceTiles[{r}][{c}].baseY,
                elevH: dbg.surfaceTiles[{r}][{c}].elevateStructure,
                needsUpdate: inst.instanceMatrix.needsUpdate
            }};
        }}''')
        print('HOTEL RESULT:', res)

    if info.get('com2'):
        r = info['com2']['r']
        c = info['com2']['c']
        instId = info['com2']['tile']['instanceId']
        res2 = page.evaluate(f'''() => {{
            const dbg = window.debugElevate;
            const inst = dbg.meshDict['Com2'];
            const mBefore = new THREE.Matrix4();
            inst.getMatrixAt({instId}, mBefore);
            const posBefore = new THREE.Vector3();
            mBefore.decompose(posBefore, new THREE.Quaternion(), new THREE.Vector3());

            window.testElevate({r}, {c}, 6);

            const mAfter = new THREE.Matrix4();
            inst.getMatrixAt({instId}, mAfter);
            const posAfter = new THREE.Vector3();
            mAfter.decompose(posAfter, new THREE.Quaternion(), new THREE.Vector3());

            const stilt = dbg.defenseVisualMeshes['elevatestructure_' + {r} + '_' + {c}];
            return {{
                r: {r}, c: {c}, instId: {instId},
                posBefore: posBefore,
                posAfter: posAfter,
                stiltFound: !!stilt,
                stiltPos: stilt ? stilt.position : null,
                baseY: dbg.surfaceTiles[{r}][{c}].baseY,
                elevH: dbg.surfaceTiles[{r}][{c}].elevateStructure,
                needsUpdate: inst.instanceMatrix.needsUpdate
            }};
        }}''')
        print('COM2 RESULT:', res2)

    browser.close()
