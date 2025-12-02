import asyncio
from playwright.async_api import async_playwright, expect

async def debug_search_input():
    """Debug test to investigate why Playwright can't interact with React input"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,  # Visible pour voir ce qui se passe
            slow_mo=1000     # Ralenti pour observer
        )
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"🖥️  Console: {msg.text}"))
        
        try:
            print("\n" + "=" * 70)
            print("🔍 DEBUG: Investigation de l'Input de Recherche")
            print("=" * 70)
            
            # Step 1: Load homepage
            print("\n📍 Étape 1: Chargement de la page...")
            await page.goto("http://localhost:3000", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)
            print("✅ Page chargée")
            
            # Step 2: Find ALL search inputs
            print("\n📍 Étape 2: Recherche de TOUS les inputs de recherche...")
            all_inputs = await page.locator('input').all()
            print(f"   Total d'inputs trouvés: {len(all_inputs)}")
            
            for i, input_elem in enumerate(all_inputs):
                try:
                    is_visible = await input_elem.is_visible()
                    input_type = await input_elem.get_attribute('type')
                    placeholder = await input_elem.get_attribute('placeholder')
                    name = await input_elem.get_attribute('name')
                    value = await input_elem.get_attribute('value')
                    
                    print(f"\n   Input #{i}:")
                    print(f"      Type: {input_type}")
                    print(f"      Placeholder: {placeholder}")
                    print(f"      Name: {name}")
                    print(f"      Value: '{value}'")
                    print(f"      Visible: {is_visible}")
                except Exception as e:
                    print(f"   Input #{i}: Erreur - {e}")
            
            # Step 3: Target the search input specifically
            print("\n📍 Étape 3: Ciblage de l'input de recherche du header...")
            search_selectors = [
                'input[type="text"][name="search"]',
                'input[type="search"]',
                'input[placeholder*="Search"]',
                'input[placeholder*="Recherch"]',
            ]
            
            for selector in search_selectors:
                try:
                    elements = await page.locator(selector).all()
                    print(f"\n   Sélecteur: {selector}")
                    print(f"   Éléments trouvés: {len(elements)}")
                    
                    for i, elem in enumerate(elements):
                        is_visible = await elem.is_visible()
                        print(f"      Élément {i}: visible={is_visible}")
                except Exception as e:
                    print(f"   Erreur avec {selector}: {e}")
            
            # Step 4: Try different methods to input text
            print("\n📍 Étape 4: Test de différentes méthodes de saisie...")
            
            # Get the search input
            search_input = page.locator('input[type="text"][name="search"]').first
            
            # Method 1: fill()
            print("\n   Méthode 1: fill()")
            await search_input.click()
            await page.wait_for_timeout(500)
            await search_input.fill("Test Sony")
            await page.wait_for_timeout(1000)
            value1 = await search_input.input_value()
            print(f"      Valeur après fill(): '{value1}'")
            await page.screenshot(path="testsprite_tests/debug_01_fill.png")
            
            # Clear
            await search_input.clear()
            await page.wait_for_timeout(500)
            
            # Method 2: type()
            print("\n   Méthode 2: type()")
            await search_input.click()
            await page.wait_for_timeout(500)
            await search_input.type("Test Sony", delay=100)
            await page.wait_for_timeout(1000)
            value2 = await search_input.input_value()
            print(f"      Valeur après type(): '{value2}'")
            await page.screenshot(path="testsprite_tests/debug_02_type.png")
            
            # Clear
            await search_input.clear()
            await page.wait_for_timeout(500)
            
            # Method 3: JavaScript evaluation
            print("\n   Méthode 3: JavaScript evaluation")
            await search_input.click()
            await page.wait_for_timeout(500)
            await search_input.evaluate("""
                (element) => {
                    element.value = 'Test Sony';
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            """)
            await page.wait_for_timeout(1000)
            value3 = await search_input.input_value()
            print(f"      Valeur après JS eval: '{value3}'")
            await page.screenshot(path="testsprite_tests/debug_03_js_eval.png")
            
            # Method 4: Press keys one by one
            print("\n   Méthode 4: Press keys individuellement")
            await search_input.clear()
            await page.wait_for_timeout(500)
            await search_input.click()
            await page.wait_for_timeout(500)
            
            text = "Sony"
            for char in text:
                await page.keyboard.press(char)
                await page.wait_for_timeout(100)
            
            await page.wait_for_timeout(1000)
            value4 = await search_input.input_value()
            print(f"      Valeur après keyboard.press(): '{value4}'")
            await page.screenshot(path="testsprite_tests/debug_04_keyboard.png")
            
            # Step 5: Check React state
            print("\n📍 Étape 5: Vérification de l'état React...")
            
            # Inject script to check React state
            react_state = await page.evaluate("""
                () => {
                    const input = document.querySelector('input[name="search"]');
                    if (!input) return { error: 'Input not found' };
                    
                    // Try to get React fiber
                    const keys = Object.keys(input);
                    const reactKey = keys.find(key => key.startsWith('__react'));
                    
                    return {
                        value: input.value,
                        hasReactKey: !!reactKey,
                        reactKey: reactKey,
                        attributes: {
                            type: input.type,
                            name: input.name,
                            placeholder: input.placeholder
                        }
                    };
                }
            """)
            
            print(f"   État React: {react_state}")
            
            # Step 6: Try to submit
            print("\n📍 Étape 6: Test de soumission...")
            await search_input.fill("Sony headphones")
            await page.wait_for_timeout(1000)
            
            final_value = await search_input.input_value()
            print(f"   Valeur finale avant soumission: '{final_value}'")
            
            await page.screenshot(path="testsprite_tests/debug_05_before_submit.png")
            
            await search_input.press("Enter")
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(2000)
            
            final_url = page.url
            print(f"   URL après soumission: {final_url}")
            await page.screenshot(path="testsprite_tests/debug_06_after_submit.png")
            
            # Summary
            print("\n" + "=" * 70)
            print("📊 RÉSUMÉ DU DEBUG")
            print("=" * 70)
            print(f"Méthode 1 (fill):     '{value1}'")
            print(f"Méthode 2 (type):     '{value2}'")
            print(f"Méthode 3 (JS eval):  '{value3}'")
            print(f"Méthode 4 (keyboard): '{value4}'")
            print(f"Valeur finale:        '{final_value}'")
            print(f"URL finale:           {final_url}")
            print("=" * 70)
            
            # Check if any method worked
            if 'Sony' in final_url:
                print("\n✅ SUCCÈS: Au moins une méthode a fonctionné!")
            else:
                print("\n❌ ÉCHEC: Aucune méthode n'a fonctionné")
            
            print("\n📸 Captures sauvegardées:")
            print("   - debug_01_fill.png")
            print("   - debug_02_type.png")
            print("   - debug_03_js_eval.png")
            print("   - debug_04_keyboard.png")
            print("   - debug_05_before_submit.png")
            print("   - debug_06_after_submit.png")
            
        except Exception as e:
            print(f"\n❌ Erreur durant le debug: {str(e)}")
            import traceback
            traceback.print_exc()
            await page.screenshot(path="testsprite_tests/debug_error.png")
        
        finally:
            # Keep browser open for inspection
            print("\n⏸️  Navigateur restera ouvert pendant 10 secondes pour inspection...")
            await page.wait_for_timeout(10000)
            await context.close()
            await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_search_input())
