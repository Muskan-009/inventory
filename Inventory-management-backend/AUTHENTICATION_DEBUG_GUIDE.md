# Authentication Debug Guide

## Problem Description
The login response is successful and returns a token, but the token is not being stored properly in the frontend application.

## Response Received
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "name": "Super Admin",
            "email": "admin@inventory.com",
            "role": "super_admin",
            "created_at": "2025-10-02T07:24:06.146Z",
            "updated_at": "2025-10-02T07:24:06.146Z",
            "is_active": true
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1OTQ4NDA1NywiZXhwIjoxNzYwMDg4ODU3fQ.3abpfs614LMH8nYGtRCHY9F6FLb2OXaj9fCkwRAC5is"
    }
}
```

## Debugging Steps

### Step 1: Start the Servers
1. Open Command Prompt or PowerShell
2. Navigate to the inventory folder
3. Run the batch file: `start-servers.bat`
   - This will start both backend (port 5000) and frontend (port 3000) servers

### Step 2: Test Authentication
1. Open your browser and go to: `http://localhost:3000/auth-test.html`
2. This will open a comprehensive authentication test page
3. Click "Test Login" to test the login functionality
4. Check the results in the test page

### Step 3: Check Browser Console
1. Open the main application: `http://localhost:3000`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try to login with the credentials:
   - Email: `admin@inventory.com`
   - Password: `admin123`
5. Look for any console errors or debug messages

### Step 4: Check localStorage
1. In Developer Tools, go to Application tab
2. Click on "Local Storage" in the left sidebar
3. Click on `http://localhost:3000`
4. Check if there's a `token` key with the JWT token value

### Step 5: Test API Calls
1. In the auth-test.html page, click "Test API Call"
2. This will test if the stored token works for API requests

## Common Issues and Solutions

### Issue 1: Token Not Stored
**Symptoms:** Login successful but no token in localStorage
**Solution:** Check if localStorage is available and working

### Issue 2: Token Stored But API Calls Fail
**Symptoms:** Token in localStorage but 401 errors on API calls
**Solution:** Check if the token is being sent in Authorization header

### Issue 3: CORS Issues
**Symptoms:** Network errors or CORS errors in console
**Solution:** Check backend CORS configuration

### Issue 4: Token Expired
**Symptoms:** Token stored but API calls return 401
**Solution:** Check token expiration time

## Files Modified for Debugging

1. **AuthContext.js** - Added console.log statements to track token storage
2. **api.js** - Added console.log statements to track API requests
3. **auth-test.html** - Comprehensive test page for authentication
4. **debug-login.html** - Simple login test page
5. **test-token.html** - localStorage test page

## Testing URLs

- Main App: `http://localhost:3000`
- Auth Test: `http://localhost:3000/auth-test.html`
- Debug Login: `http://localhost:3000/debug-login.html`
- Token Test: `http://localhost:3000/test-token.html`
- Backend Health: `http://localhost:5000/health`

## Expected Behavior

1. Login should store token in localStorage
2. Token should be automatically added to API requests
3. User should be redirected to dashboard after successful login
4. User should stay logged in on page refresh

## Clean Up

After debugging, remove the console.log statements from:
- `src/context/AuthContext.js`
- `src/services/api.js`

And delete the test HTML files:
- `public/auth-test.html`
- `public/debug-login.html`
- `public/test-token.html`
