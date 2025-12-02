import asyncio
import os
from datetime import datetime
from playwright.async_api import async_playwright, expect

# Create screenshots directory
SCREENSHOTS_DIR = "testsprite_tests/screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

async def take_screenshot(page, name: str, step: int):
    """Take a screenshot with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{SCREENSHOTS_DIR}/{step:02d}_{name}_{timestamp}.png"
    await page.screenshot(path=filename, full_page=True)
    print(f"   📸 Screenshot saved: {filename}")
    return filename

async def run_test():
    """Complete search test with screenshots at each step"""
    async with async_playwright() as p:
        # Launch browser in non-headless mode to see the test
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=500  # Slow down by 500ms to see actions
        )
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = await context.new_page()
        
        screenshots = []
        step = 0
        
        try:
            print("\n" + "=" * 70)
            print("🔍 TEST DE RECHERCHE AVEC CAPTURES D'ÉCRAN")
            print("=" * 70)
            
            # Step 1: Load homepage
            step += 1
            print(f"\n📍 Étape {step}: Chargement de la page d'accueil...")
            await page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=10000)
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "homepage_loaded", step)
            screenshots.append(screenshot)
            print("   ✅ Page d'accueil chargée")
            
            # Step 2: Locate search bar
            step += 1
            print(f"\n📍 Étape {step}: Localisation de la barre de recherche...")
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await expect(search_input).to_be_visible(timeout=5000)
            
            # Highlight search bar
            await search_input.evaluate("element => element.style.border = '3px solid red'")
            await page.wait_for_timeout(500)
            screenshot = await take_screenshot(page, "search_bar_located", step)
            screenshots.append(screenshot)
            await search_input.evaluate("element => element.style.border = ''")
            print("   ✅ Barre de recherche localisée")
            
            # Step 3: Search for Sony headphones
            step += 1
            print(f"\n📍 Étape {step}: Recherche 'Sony headphones'...")
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await page.wait_for_timeout(500)
            screenshot = await take_screenshot(page, "search_bar_focused", step)
            screenshots.append(screenshot)
            
            # Type slowly to ensure text is captured
            await search_input.type("Sony headphones", delay=100)
            await page.wait_for_timeout(1500)
            screenshot = await take_screenshot(page, "sony_typed", step)
            screenshots.append(screenshot)
            print("   ✅ Texte saisi: 'Sony headphones'")
            
            # Check for autocomplete
            try:
                autocomplete = page.locator('[role="listbox"], [class*="autocomplete"], [class*="suggestion"]').first
                await expect(autocomplete).to_be_visible(timeout=2000)
                screenshot = await take_screenshot(page, "autocomplete_visible", step)
                screenshots.append(screenshot)
                print("   ✅ Suggestions d'autocomplétion affichées")
            except:
                print("   ⚠️  Pas de suggestions d'autocomplétion")
            
            # Step 4: Submit search
            step += 1
            print(f"\n📍 Étape {step}: Soumission de la recherche...")
            await search_input.press("Enter")
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "sony_results", step)
            screenshots.append(screenshot)
            print(f"   ✅ Résultats affichés - URL: {page.url}")
            
            # Step 5: Search for Samsung Galaxy
            step += 1
            print(f"\n📍 Étape {step}: Recherche 'Samsung Galaxy'...")
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.type("Samsung Galaxy", delay=100)
            await page.wait_for_timeout(1500)
            screenshot = await take_screenshot(page, "samsung_typed", step)
            screenshots.append(screenshot)
            
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "samsung_results", step)
            screenshots.append(screenshot)
            print(f"   ✅ Résultats Samsung affichés")
            
            # Step 6: Search for denim jacket
            step += 1
            print(f"\n📍 Étape {step}: Recherche 'denim jacket'...")
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.type("denim jacket", delay=100)
            await page.wait_for_timeout(1500)
            screenshot = await take_screenshot(page, "denim_typed", step)
            screenshots.append(screenshot)
            
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "denim_results", step)
            screenshots.append(screenshot)
            print(f"   ✅ Résultats vêtements affichés")
            
            # Step 7: Search for running shoes
            step += 1
            print(f"\n📍 Étape {step}: Recherche 'running shoes'...")
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.type("running shoes", delay=100)
            await page.wait_for_timeout(1500)
            screenshot = await take_screenshot(page, "shoes_typed", step)
            screenshots.append(screenshot)
            
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "shoes_results", step)
            screenshots.append(screenshot)
            print(f"   ✅ Résultats chaussures affichés")
            
            # Step 8: Test typo tolerance
            step += 1
            print(f"\n📍 Étape {step}: Test de tolérance aux fautes - 'Samung Galxy'...")
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.type("Samung Galxy", delay=100)
            await page.wait_for_timeout(1500)
            screenshot = await take_screenshot(page, "typo_typed", step)
            screenshots.append(screenshot)
            
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "typo_results", step)
            screenshots.append(screenshot)
            print(f"   ✅ Tolérance aux fautes testée")
            
            # Step 9: Test no results
            step += 1
            print(f"\n📍 Étape {step}: Test sans résultats - 'xyzabc123notfound'...")
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.type("xyzabc123notfound", delay=100)
            await page.wait_for_timeout(1500)
            screenshot = await take_screenshot(page, "no_results_typed", step)
            screenshots.append(screenshot)
            
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "no_results_page", step)
            screenshots.append(screenshot)
            
            # Check for no results message
            try:
                for selector in ['text=No results', 'text=Aucun résultat', 'text=No products']:
                    try:
                        element = page.locator(selector).first
                        await expect(element).to_be_visible(timeout=2000)
                        print(f"   ✅ Message 'aucun résultat' affiché")
                        break
                    except:
                        continue
            except:
                print(f"   ⚠️  Message 'aucun résultat' non trouvé")
            
            # Step 10: Back to homepage
            step += 1
            print(f"\n📍 Étape {step}: Retour à la page d'accueil...")
            await page.goto("http://localhost:3000")
            await page.wait_for_timeout(2000)
            screenshot = await take_screenshot(page, "final_homepage", step)
            screenshots.append(screenshot)
            print("   ✅ Retour à la page d'accueil")
            
            # Summary
            print("\n" + "=" * 70)
            print("📊 RÉSUMÉ DU TEST")
            print("=" * 70)
            print(f"✅ Étapes complétées: {step}")
            print(f"📸 Captures d'écran: {len(screenshots)}")
            print(f"\n📁 Dossier des captures: {SCREENSHOTS_DIR}/")
            print("\n📋 Liste des captures:")
            for i, screenshot in enumerate(screenshots, 1):
                print(f"   {i}. {os.path.basename(screenshot)}")
            print("=" * 70)
            print("\n🎉 Test terminé avec succès!")
            
        except Exception as e:
            print(f"\n❌ Erreur durant le test: {str(e)}")
            step += 1
            await take_screenshot(page, "error", step)
            raise
        
        finally:
            # Keep browser open for 3 seconds to see final state
            await page.wait_for_timeout(3000)
            await context.close()
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_test())
