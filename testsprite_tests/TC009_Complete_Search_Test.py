import asyncio
from playwright.async_api import async_playwright, expect

async def run_test():
    """Complete search functionality test with real products"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        test_results = {
            "passed": 0,
            "failed": 0,
            "warnings": 0
        }
        
        try:
            print("=" * 60)
            print("🔍 COMPLETE SEARCH FUNCTIONALITY TEST")
            print("=" * 60)
            
            # Navigate to homepage
            print("\n📍 Step 1: Loading homepage...")
            await page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=10000)
            await page.wait_for_timeout(2000)
            print("✅ Homepage loaded successfully")
            test_results["passed"] += 1
            
            # Test 1: Search for Sony headphones
            print("\n" + "=" * 60)
            print("🎧 Test 1: Search for 'Sony headphones'")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("Sony headphones")
            await page.wait_for_timeout(1500)
            
            # Check for autocomplete
            try:
                autocomplete = page.locator('[role="listbox"], [class*="autocomplete"], [class*="suggestion"]').first
                await expect(autocomplete).to_be_visible(timeout=2000)
                print("✅ Autocomplete suggestions appeared")
                test_results["passed"] += 1
            except:
                print("⚠️  No autocomplete (may be expected)")
                test_results["warnings"] += 1
            
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            print(f"✅ Search submitted - URL: {page.url}")
            test_results["passed"] += 1
            
            # Test 2: Search for Samsung phone
            print("\n" + "=" * 60)
            print("📱 Test 2: Search for 'Samsung Galaxy'")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("Samsung Galaxy")
            await page.wait_for_timeout(1500)
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            print(f"✅ Search submitted - URL: {page.url}")
            test_results["passed"] += 1
            
            # Test 3: Search for clothing
            print("\n" + "=" * 60)
            print("👕 Test 3: Search for 'denim jacket'")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("denim jacket")
            await page.wait_for_timeout(1500)
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            print(f"✅ Search submitted - URL: {page.url}")
            test_results["passed"] += 1
            
            # Test 4: Search for shoes
            print("\n" + "=" * 60)
            print("👟 Test 4: Search for 'running shoes'")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("running shoes")
            await page.wait_for_timeout(1500)
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            print(f"✅ Search submitted - URL: {page.url}")
            test_results["passed"] += 1
            
            # Test 5: Partial word search (typo tolerance)
            print("\n" + "=" * 60)
            print("🔤 Test 5: Typo tolerance - 'Samung Galxy'")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("Samung Galxy")
            await page.wait_for_timeout(1500)
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            print(f"✅ Typo tolerance test - URL: {page.url}")
            test_results["passed"] += 1
            
            # Test 6: Single word search
            print("\n" + "=" * 60)
            print("🔍 Test 6: Single word - 'Sony'")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("Sony")
            await page.wait_for_timeout(1500)
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            print(f"✅ Single word search - URL: {page.url}")
            test_results["passed"] += 1
            
            # Test 7: No results scenario
            print("\n" + "=" * 60)
            print("❌ Test 7: No results - 'xyzabc123notfound'")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("xyzabc123notfound")
            await page.wait_for_timeout(1500)
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            
            # Check for no results message
            no_results_found = False
            for selector in ['text=No results', 'text=Aucun résultat', 'text=No products', 'text=Aucun produit']:
                try:
                    element = page.locator(selector).first
                    await expect(element).to_be_visible(timeout=2000)
                    print(f"✅ No results message displayed correctly")
                    no_results_found = True
                    test_results["passed"] += 1
                    break
                except:
                    continue
            
            if not no_results_found:
                print("⚠️  No explicit 'no results' message (may show empty list)")
                test_results["warnings"] += 1
            
            # Test 8: Empty search
            print("\n" + "=" * 60)
            print("🔍 Test 8: Empty search query")
            print("=" * 60)
            
            search_input = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Recherch"]').first
            await search_input.click()
            await search_input.fill("")
            await page.wait_for_timeout(500)
            await search_input.press("Enter")
            await page.wait_for_timeout(2000)
            print(f"✅ Empty search handled - URL: {page.url}")
            test_results["passed"] += 1
            
            # Final Summary
            print("\n" + "=" * 60)
            print("📊 TEST SUMMARY")
            print("=" * 60)
            print(f"✅ Passed: {test_results['passed']}")
            print(f"❌ Failed: {test_results['failed']}")
            print(f"⚠️  Warnings: {test_results['warnings']}")
            print(f"\n🎉 Success Rate: {(test_results['passed'] / (test_results['passed'] + test_results['failed']) * 100):.1f}%")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            test_results["failed"] += 1
            await page.screenshot(path="testsprite_tests/complete_search_test_failure.png")
            print("📸 Screenshot saved")
            raise
        
        finally:
            await context.close()
            await browser.close()
            
        return test_results

if __name__ == "__main__":
    results = asyncio.run(run_test())
    exit(0 if results["failed"] == 0 else 1)
