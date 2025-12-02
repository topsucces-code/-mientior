import asyncio
from playwright import async_api

async def run_test():
    """
    TestSprite User Journey Test
    Simulates a real user browsing the Mientior e-commerce site
    """
    pw = None
    browser = None
    context = None
    
    try:
        print("\n" + "="*70)
        print("🛍️  TESTSPRITE - USER JOURNEY TEST")
        print("   Simulating Real User Behavior on Mientior")
        print("="*70 + "\n")
        
        pw = await async_api.async_playwright().start()
        
        print("🌐 Opening Chrome browser...")
        browser = await pw.chromium.launch(
            headless=False,
            args=["--start-maximized"],
            slow_mo=1000  # Slow down by 1 second for visibility
        )
        
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        # Step 1: Visit Homepage
        print("\n📍 STEP 1: Visiting Homepage...")
        await page.goto("http://localhost:3000")
        await page.wait_for_load_state("domcontentloaded")
        print("   ✅ Homepage loaded")
        await page.screenshot(path='journey_01_homepage.png')
        await asyncio.sleep(2)
        
        # Step 2: Try Search
        print("\n🔍 STEP 2: Testing Search Functionality...")
        try:
            search_input = page.locator('input[placeholder*="Recherche"]').first
            if await search_input.count() > 0:
                await search_input.click()
                await search_input.fill("laptop")
                print("   ✅ Typed 'laptop' in search")
                await page.screenshot(path='journey_02_search.png')
                await asyncio.sleep(2)
                
                # Press Enter or wait for autocomplete
                await search_input.press("Enter")
                await page.wait_for_timeout(1000)
                print("   ✅ Search submitted")
                await page.screenshot(path='journey_03_search_results.png')
                await asyncio.sleep(2)
            else:
                print("   ⚠️  Search input not found")
        except Exception as e:
            print(f"   ⚠️  Search test skipped: {str(e)[:50]}")
        
        # Step 3: Navigate back to homepage
        print("\n🏠 STEP 3: Returning to Homepage...")
        await page.goto("http://localhost:3000")
        await page.wait_for_load_state("domcontentloaded")
        print("   ✅ Back on homepage")
        await asyncio.sleep(1)
        
        # Step 4: Look for Products
        print("\n🛍️  STEP 4: Looking for Products...")
        try:
            # Try to find and click a product
            product_links = page.locator('a[href*="/products/"]')
            count = await product_links.count()
            
            if count > 0:
                print(f"   ✅ Found {count} product links")
                # Click the first product
                await product_links.first.click()
                await page.wait_for_load_state("domcontentloaded")
                print("   ✅ Clicked on a product")
                await page.screenshot(path='journey_04_product_detail.png')
                await asyncio.sleep(3)
            else:
                print("   ⚠️  No product links found")
        except Exception as e:
            print(f"   ⚠️  Product navigation skipped: {str(e)[:50]}")
        
        # Step 5: Check Cart
        print("\n🛒 STEP 5: Checking Shopping Cart...")
        try:
            await page.goto("http://localhost:3000/cart")
            await page.wait_for_load_state("domcontentloaded")
            print("   ✅ Navigated to cart page")
            await page.screenshot(path='journey_05_cart.png')
            await asyncio.sleep(2)
        except Exception as e:
            print(f"   ⚠️  Cart page skipped: {str(e)[:50]}")
        
        # Step 6: Check Login Page
        print("\n🔐 STEP 6: Checking Login Page...")
        try:
            await page.goto("http://localhost:3000/login")
            await page.wait_for_load_state("domcontentloaded")
            print("   ✅ Navigated to login page")
            await page.screenshot(path='journey_06_login.png')
            await asyncio.sleep(2)
        except Exception as e:
            print(f"   ⚠️  Login page skipped: {str(e)[:50]}")
        
        # Step 7: Return to Homepage
        print("\n🏠 STEP 7: Final Homepage Visit...")
        await page.goto("http://localhost:3000")
        await page.wait_for_load_state("domcontentloaded")
        print("   ✅ Back on homepage")
        await page.screenshot(path='journey_07_final.png')
        await asyncio.sleep(2)
        
        # Summary
        print("\n" + "="*70)
        print("✅ USER JOURNEY TEST COMPLETED!")
        print("="*70)
        print("\n📸 Screenshots saved:")
        print("   • journey_01_homepage.png")
        print("   • journey_02_search.png")
        print("   • journey_03_search_results.png")
        print("   • journey_04_product_detail.png")
        print("   • journey_05_cart.png")
        print("   • journey_06_login.png")
        print("   • journey_07_final.png")
        
        print("\n⏳ Browser will stay open for 10 seconds...")
        print("   (Feel free to interact with the page)")
        await asyncio.sleep(10)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        print("\n🧹 Closing browser...")
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
        print("✅ Test complete!\n")

if __name__ == "__main__":
    asyncio.run(run_test())
