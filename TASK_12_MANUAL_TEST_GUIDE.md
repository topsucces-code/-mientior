# Task 12: Admin Login - Manual Testing Guide

## Prerequisites

Before testing, ensure you have:
1. A running PostgreSQL database
2. Redis running (for session caching)
3. An admin user in the database

### Create a Test Admin User

If you don't have an admin user, create one using Prisma Studio or a seed script:

```bash
npm run db:studio
```

Or use the existing seed script:
```bash
npm run db:seed:admin
```

This should create an admin user with:
- Email: `admin@mientior.com`
- Password: (set during seed)
- Role: `SUPER_ADMIN`
- isActive: `true`

## Test Scenarios

### 1. Successful Admin Login

**Steps:**
1. Navigate to `http://localhost:3000/admin`
2. You should be redirected to `http://localhost:3000/admin/login?redirectTo=/admin`
3. Enter valid admin credentials:
   - Email: `admin@mientior.com`
   - Password: (your admin password)
4. Click "Sign In to Admin Panel"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Redirected to `/admin` dashboard
- ✅ Admin panel loads with sidebar and header
- ✅ User identity shows in header (admin name)
- ✅ `lastLoginAt` timestamp updated in database

### 2. Invalid Credentials

**Steps:**
1. Navigate to `http://localhost:3000/admin/login`
2. Enter invalid credentials:
   - Email: `admin@mientior.com`
   - Password: `wrongpassword`
3. Click "Sign In to Admin Panel"

**Expected Result:**
- ✅ Error message: "Invalid email or password"
- ✅ Form remains on login page
- ✅ No redirect occurs

### 3. Non-Admin User Attempt

**Steps:**
1. Create a regular customer account (not an admin)
2. Navigate to `http://localhost:3000/admin/login`
3. Enter customer credentials
4. Click "Sign In to Admin Panel"

**Expected Result:**
- ✅ Error message: "Access denied. Admin privileges required."
- ✅ User is logged out automatically
- ✅ Form remains on login page

### 4. Inactive Admin Account

**Steps:**
1. In Prisma Studio, set an admin user's `isActive` to `false`
2. Navigate to `http://localhost:3000/admin/login`
3. Enter that admin's credentials
4. Click "Sign In to Admin Panel"

**Expected Result:**
- ✅ Error message: "Account is deactivated. Please contact support."
- ✅ User is logged out automatically
- ✅ Form remains on login page

### 5. Already Authenticated Admin

**Steps:**
1. Login as an admin successfully
2. Navigate to `http://localhost:3000/admin/login` directly

**Expected Result:**
- ✅ Immediately redirected to `/admin` dashboard
- ✅ No login form shown

### 6. Protected Admin Routes

**Steps:**
1. Logout if logged in
2. Try to access various admin routes:
   - `http://localhost:3000/admin`
   - `http://localhost:3000/admin/products`
   - `http://localhost:3000/admin/orders`

**Expected Result:**
- ✅ All routes redirect to `/admin/login?redirectTo=/admin/[route]`
- ✅ After login, redirected to the intended route

### 7. Admin Logout

**Steps:**
1. Login as an admin
2. Click the logout button in the admin header
3. Confirm logout

**Expected Result:**
- ✅ Redirected to `/admin/login`
- ✅ Session cleared
- ✅ Attempting to access `/admin` redirects to login

### 8. Session Persistence

**Steps:**
1. Login as an admin
2. Refresh the page
3. Navigate to different admin pages
4. Close and reopen the browser tab

**Expected Result:**
- ✅ Session persists across page refreshes
- ✅ No need to login again
- ✅ Admin identity maintained

### 9. Refine Integration

**Steps:**
1. Login as an admin
2. Navigate to `/admin/products`
3. Try to create/edit a product
4. Check the user dropdown in the header

**Expected Result:**
- ✅ Refine loads correctly
- ✅ User identity shows admin name
- ✅ All CRUD operations work
- ✅ Permissions are enforced based on role

### 10. Concurrent Sessions

**Steps:**
1. Login as an admin in Chrome
2. Open Firefox and login with the same admin account
3. Verify both sessions work independently

**Expected Result:**
- ✅ Both sessions are active
- ✅ Both can access admin panel
- ✅ Actions in one don't affect the other

## Database Verification

After successful login, verify in the database:

```sql
-- Check lastLoginAt was updated
SELECT id, email, "lastLoginAt", "isActive" 
FROM admin_users 
WHERE email = 'admin@mientior.com';

-- Check session was created
SELECT id, "userId", "expiresAt", "ipAddress", "userAgent"
FROM sessions
WHERE "userId" = (
  SELECT "authUserId" FROM admin_users WHERE email = 'admin@mientior.com'
)
ORDER BY "createdAt" DESC
LIMIT 1;

-- Check authUserId was linked
SELECT id, email, "authUserId"
FROM admin_users
WHERE email = 'admin@mientior.com';
```

## API Testing with cURL

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mientior.com",
    "password": "your-password"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@mientior.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN"
  }
}
```

**Expected Response (Invalid Credentials):**
```json
{
  "error": "Invalid email or password"
}
```

### Test Admin Check
```bash
curl -X GET http://localhost:3000/api/auth/admin/check \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

**Expected Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "...",
    "email": "admin@mientior.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN"
  }
}
```

## Common Issues and Solutions

### Issue: "Access denied" for valid admin
**Solution:** Check that the AdminUser record exists and `isActive` is `true`

### Issue: Redirect loop
**Solution:** Clear cookies and try again. Check middleware configuration.

### Issue: "Account is deactivated"
**Solution:** Set `isActive` to `true` in the database

### Issue: Session not persisting
**Solution:** Check Redis is running and accessible

### Issue: Refine not loading
**Solution:** Check browser console for errors. Verify auth provider is configured correctly.

## Success Criteria

All tests should pass with:
- ✅ Valid admin can login
- ✅ Invalid credentials rejected
- ✅ Non-admin users rejected
- ✅ Inactive admins rejected
- ✅ Routes protected by middleware
- ✅ Session persists correctly
- ✅ Refine integration works
- ✅ lastLoginAt updated
- ✅ authUserId linked

## Notes

- The admin login page has a distinct blue gradient design to differentiate from customer login
- All login attempts are logged (future enhancement: audit logging)
- The system uses Better Auth for core authentication
- Admin sessions are cached in Redis for performance
- The middleware protects all `/admin/*` routes except `/admin/login`
