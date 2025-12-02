import asyncio
import random
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    """
    TestSprite Authentication Test
    Tests user registration and login flow
    """
    pw = None
    browser = None
    context = None
    
    # Generate unique test user
    timestamp = random.randint(1000, 9999)
    test_email = f"testuser{timestamp}@example.com"
    test_password = "TestPassword123!"
    test_name = f"Test User {timestamp}"
    
    try:
        print("\n" + "="*70)
        print("🔐 TESTSPRITE - AUTHENTICATION TEST")
        print("   Testing Registration and Login Flow")
        print("="*70 + "\n")
        
        pw = await async_api.async_playwright().start()
        
        print("🌐 Opening Chrome browser...")
        browser = await pw.chromium.launch(
            headless=False,
            args=["--start-maximized"],
            slow_mo=800  # Slow down by 800ms for visibility
        )
        
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        
        # ============================================================
        # PART 1: USER REGISTRATION
        # ============================================================
        
        print("\n" + "="*70)
        print("📝 PART 1: USER REGISTRATION")
        print("="*70 + "\n")
        
        print("📍 STEP 1: Navigate to Register Page...")
        await page.goto("http://localhost:3000/register")
        await page.wait_for_load_state("domcontentloaded")
        print(f"   ✅ Register page loaded")
        await page.screenshot(path='auth_01_register_page.png')
        await asyncio.sleep(2)
        
        print(f"\n📝 STEP 2: Fill Registration Form...")
        print(f"   Email: {test_email}")
        print(f"   Name: {test_name}")
        print(f"   Password: {test_password}")
        
        # Try to find and fill the registration form
        try:
            # Look for name input
            name_selectors = [
                'input[name="name"]',
                'input[placeholder*="nom"]',
                'input[placeholder*="Name"]',
                'input[type="text"]'
            ]
            
            for selector in name_selectors:
                name_input = page.locator(selector).first
                if await name_input.count() > 0:
                    await name_input.click()
                    await name_input.fill(test_name)
                    print(f"   ✅ Name filled: {selector}")
                    break
            
            await asyncio.sleep(1)
            
            # Look for email input
            email_selectors = [
                'input[name="email"]',
                'input[type="email"]',
                'input[placeholder*="email"]',
                'input[placeholder*="Email"]'
            ]
            
            for selector in email_selectors:
                email_input = page.locator(selector).first
                if await email_input.count() > 0:
                    await email_input.click()
                    await email_input.fill(test_email)
                    print(f"   ✅ Email filled: {selector}")
                    break
            
            await asyncio.sleep(1)
            
            # Look for password input
            password_selectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[placeholder*="password"]',
                'input[placeholder*="mot de passe"]'
            ]
            
            password_inputs = page.locator('input[type="password"]')
            password_count = await password_inputs.count()
            
            if password_count > 0:
                # Fill first password field
                await password_inputs.nth(0).click()
                await password_inputs.nth(0).fill(test_password)
                print(f"   ✅ Password filled")
                
                await asyncio.sleep(1)
                
                # If there's a confirm password field, fill it too
                if password_count > 1:
                    await password_inputs.nth(1).click()
                    await password_inputs.nth(1).fill(test_password)
                    print(f"   ✅ Confirm password filled")
            
            await page.screenshot(path='auth_02_register_form_filled.png')
            await asyncio.sleep(2)
            
            print("\n🚀 STEP 3: Submit Registration...")
            
            # Look for submit button
            submit_selectors = [
                'button[type="submit"]',
                'button:has-text("S\'inscrire")',
                'button:has-text("Register")',
                'button:has-text("Créer")',
                'button:has-text("Sign up")'
            ]
            
            for selector in submit_selectors:
                submit_btn = page.locator(selector).first
                if await submit_btn.count() > 0:
                    await submit_btn.click()
                    print(f"   ✅ Submit button clicked: {selector}")
                    break
            
            await page.wait_for_timeout(3000)
            await page.screenshot(path='auth_03_after_register.png')
            
            current_url = page.url
            print(f"   📍 Current URL: {current_url}")
            
            if "verify" in current_url.lower() or "email" in current_url.lower():
                print("   ✅ Redirected to email verification page")
            elif "account" in current_url.lower() or "dashboard" in current_url.lower():
                print("   ✅ Redirected to account dashboard")
            else:
                print(f"   ℹ️  Current page: {current_url}")
            
        except Exception as e:
            print(f"   ⚠️  Registration form interaction: {str(e)[:100]}")
        
        await asyncio.sleep(3)
        
        # ============================================================
        # PART 2: USER LOGIN
        # ============================================================
        
        print("\n" + "="*70)
        print("🔑 PART 2: USER LOGIN")
        print("="*70 + "\n")
        
        print("📍 STEP 4: Navigate to Login Page...")
        await page.goto("http://localhost:3000/login")
        await page.wait_for_load_state("domcontentloaded")
        print(f"   ✅ Login page loaded")
        await page.screenshot(path='auth_04_login_page.png')
        await asyncio.sleep(2)
        
        print(f"\n🔐 STEP 5: Fill Login Form...")
        print(f"   Email: {test_email}")
        print(f"   Password: {test_password}")
        
        try:
            # Fill email
            email_input = page.locator('input[type="email"]').first
            if await email_input.count() > 0:
                await email_input.click()
                await email_input.fill(test_email)
                print(f"   ✅ Email filled")
            
            await asyncio.sleep(1)
            
            # Fill password
            password_input = page.locator('input[type="password"]').first
            if await password_input.count() > 0:
                await password_input.click()
                await password_input.fill(test_password)
                print(f"   ✅ Password filled")
            
            await page.screenshot(path='auth_05_login_form_filled.png')
            await asyncio.sleep(2)
            
            print("\n🚀 STEP 6: Submit Login...")
            
            # Look for login button
            login_selectors = [
                'button[type="submit"]',
                'button:has-text("Connexion")',
                'button:has-text("Login")',
                'button:has-text("Se connecter")',
                'button:has-text("Sign in")'
            ]
            
            for selector in login_selectors:
                login_btn = page.locator(selector).first
                if await login_btn.count() > 0:
                    await login_btn.click()
                    print(f"   ✅ Login button clicked: {selector}")
                    break
            
            await page.wait_for_timeout(3000)
            await page.screenshot(path='auth_06_after_login.png')
            
            current_url = page.url
            print(f"   📍 Current URL: {current_url}")
            
            if "account" in current_url.lower() or "dashboard" in current_url.lower():
                print("   ✅ Successfully logged in - redirected to account")
            elif "verify" in current_url.lower():
                print("   ℹ️  Email verification required")
            else:
                print(f"   ℹ️  Current page: {current_url}")
            
        except Exception as e:
            print(f"   ⚠️  Login form interaction: {str(e)[:100]}")
        
        await asyncio.sleep(3)
        
        # ============================================================
        # PART 3: CHECK AUTHENTICATION STATE
        # ============================================================
        
        print("\n" + "="*70)
        print("🔍 PART 3: VERIFY AUTHENTICATION")
        print("="*70 + "\n")
        
        print("📍 STEP 7: Check if user is authenticated...")
        
        # Try to access account page
        await page.goto("http://localhost:3000/account")
        await page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(2)
        
        current_url = page.url
        print(f"   📍 Current URL: {current_url}")
        
        if "account" in current_url.lower():
            print("   ✅ User is authenticated - account page accessible")
        elif "login" in current_url.lower():
            print("   ⚠️  User not authenticated - redirected to login")
        elif "verify" in current_url.lower():
            print("   ℹ️  Email verification required")
        
        await page.screenshot(path='auth_07_authentication_check.png')
        await asyncio.sleep(2)
        
        # Final Summary
        print("\n" + "="*70)
        print("✅ AUTHENTICATION TEST COMPLETED!")
        print("="*70)
        print("\n📊 Test Summary:")
        print(f"   • Test User: {test_email}")
        print(f"   • Registration: Attempted")
        print(f"   • Login: Attempted")
        print(f"   • Final URL: {current_url}")
        print("\n📸 Screenshots saved:")
        print("   • auth_01_register_page.png")
        print("   • auth_02_register_form_filled.png")
        print("   • auth_03_after_register.png")
        print("   • auth_04_login_page.png")
        print("   • auth_05_login_form_filled.png")
        print("   • auth_06_after_login.png")
        print("   • auth_07_authentication_check.png")
        
        print("\n⏳ Browser will stay open for 15 seconds...")
        print("   (You can interact with the page)")
        await asyncio.sleep(15)
        
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
