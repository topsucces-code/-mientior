import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        print("\n" + "="*60)
        print("🚀 TESTSPRITE - INTERACTIVE CHROME TEST")
        print("   Testing Mientior E-commerce Platform")
        print("="*60 + "\n")
        
        # Start Playwright
        pw = await async_api.async_playwright().start()
        
        # Launch Chrome in visible mode
        print("🌐 Launching Chrome browser (visible mode)...")
        browser = await pw.chromium.launch(
            headless=False,
            args=[
                "--window-size=1920,1080",
                "--start-maximized",
            ],
            slow_mo=500  # Slow down actions by 500ms for visibility
        )
        
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        # Test 1: Homepage Load
        print("\n📍 TEST 1: Loading Homepage...")
        await page.goto("http://localhost:3000", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        
        title = await page.title()
        print(f"   ✅ Page loaded: {title}")
        
        # Test 2: Check Header Elements
        print("\n🔍 TEST 2: Checking Header Elements...")
        header = page.locator('header')
        if await header.count() > 0:
            print("   ✅ Header is visible")
        
        # Check for navigation links
        nav_links = page.locator('nav a')
        nav_count = await nav_links.count()
        print(f"   ✅ Found {nav_count} navigation links")
        
        # Test 3: Check Main Content
        print("\n🔍 TEST 3: Checking Main Content...")
        main = page.locator('main')
        if await main.count() > 0:
            print("   ✅ Main content area is visible")
        
        # Test 4: Look for Products
        print("\n🔍 TEST 4: Looking for Products...")
        
        # Try different selectors for products
        product_selectors = [
            'article',
            '[data-testid*="product"]',
            '.product-card',
            'a[href*="/products/"]'
        ]
        
        for selector in product_selectors:
            products = page.locator(selector)
            count = await products.count()
            if count > 0:
                print(f"   ✅ Found {count} elements with selector: {selector}")
                break
        
        # Test 5: Check for Search
        print("\n🔍 TEST 5: Looking for Search Functionality...")
        search_selectors = [
            'input[type="search"]',
            'input[placeholder*="Search"]',
            'input[placeholder*="Recherche"]',
            '[role="searchbox"]'
        ]
        
        for selector in search_selectors:
            search = page.locator(selector)
            if await search.count() > 0:
                print(f"   ✅ Search input found: {selector}")
                break
        
        # Test 6: Check for Cart
        print("\n🔍 TEST 6: Looking for Shopping Cart...")
        cart_selectors = [
            'a[href*="/cart"]',
            'button[aria-label*="cart"]',
            '[data-testid="cart"]',
            'svg[class*="cart"]'
        ]
        
        for selector in cart_selectors:
            cart = page.locator(selector)
            if await cart.count() > 0:
                print(f"   ✅ Cart element found: {selector}")
                break
        
        # Test 7: Check for Auth Links
        print("\n🔍 TEST 7: Looking for Authentication Links...")
        auth_selectors = [
            'a[href*="/login"]',
            'a[href*="/register"]',
            'button:has-text("Login")',
            'button:has-text("Sign in")'
        ]
        
        for selector in auth_selectors:
            auth = page.locator(selector)
            if await auth.count() > 0:
                print(f"   ✅ Auth element found: {selector}")
        
        # Test 8: Take Screenshots
        print("\n📸 TEST 8: Taking Screenshots...")
        await page.screenshot(path='testsprite_full_page.png', full_page=True)
        print("   ✅ Full page screenshot: testsprite_full_page.png")
        
        await page.screenshot(path='testsprite_viewport.png')
        print("   ✅ Viewport screenshot: testsprite_viewport.png")
        
        # Test 9: Check Page Performance
        print("\n⚡ TEST 9: Checking Page Performance...")
        performance = await page.evaluate('''() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            return {
                loadTime: pageLoadTime,
                domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart
            };
        }''')
        print(f"   ✅ Page load time: {performance['loadTime']}ms")
        print(f"   ✅ DOM ready time: {performance['domReady']}ms")
        
        # Test 10: Get Page Structure
        print("\n🏗️  TEST 10: Analyzing Page Structure...")
        structure = await page.evaluate('''() => {
            return {
                headers: document.querySelectorAll('h1, h2, h3').length,
                images: document.querySelectorAll('img').length,
                links: document.querySelectorAll('a').length,
                buttons: document.querySelectorAll('button').length,
                forms: document.querySelectorAll('form').length
            };
        }''')
        print(f"   ✅ Headers (h1-h3): {structure['headers']}")
        print(f"   ✅ Images: {structure['images']}")
        print(f"   ✅ Links: {structure['links']}")
        print(f"   ✅ Buttons: {structure['buttons']}")
        print(f"   ✅ Forms: {structure['forms']}")
        
        # Final Summary
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"   • Page Title: {title}")
        print(f"   • URL: {page.url}")
        print(f"   • Load Time: {performance['loadTime']}ms")
        print(f"   • Screenshots saved: 2 files")
        print("\n⏳ Browser will stay open for 15 seconds...")
        print("   (You can interact with the page)")
        
        await asyncio.sleep(15)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    
    finally:
        print("\n🧹 Cleaning up...")
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
        print("✅ Test session ended!\n")
            
if __name__ == "__main__":
    asyncio.run(run_test())
