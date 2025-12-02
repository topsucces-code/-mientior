import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        print("🚀 Starting TestSprite test in Chrome (visible mode)...")
        
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in HEADED mode (visible)
        print("🌐 Launching Chrome browser...")
        browser = await pw.chromium.launch(
            headless=False,  # Make browser visible
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
            ],
        )
        
        # Create a new browser context
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page
        page = await context.new_page()
        
        print("📍 Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=10000)
        
        print("⏳ Waiting for page to load...")
        await page.wait_for_timeout(2000)
        
        # Check if the page loaded
        print("✅ Checking if header is visible...")
        header = page.locator('header')
        if await header.count() > 0:
            print("✅ Header found!")
        else:
            print("❌ Header not found")
        
        print("✅ Checking if main content is visible...")
        main = page.locator('main')
        if await main.count() > 0:
            print("✅ Main content found!")
        else:
            print("❌ Main content not found")
        
        # Take a screenshot
        print("📸 Taking screenshot...")
        await page.screenshot(path='testsprite_homepage_screenshot.png')
        print("✅ Screenshot saved as 'testsprite_homepage_screenshot.png'")
        
        # Get page title
        title = await page.title()
        print(f"📄 Page title: {title}")
        
        # Get page URL
        url = page.url
        print(f"🔗 Current URL: {url}")
        
        print("\n✅ Test completed! Browser will stay open for 10 seconds...")
        await asyncio.sleep(10)
        
        print("✅ SUCCESS: Homepage loaded successfully in Chrome!")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise
    
    finally:
        print("🧹 Cleaning up...")
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
        print("✅ Cleanup complete!")
            
if __name__ == "__main__":
    asyncio.run(run_test())
