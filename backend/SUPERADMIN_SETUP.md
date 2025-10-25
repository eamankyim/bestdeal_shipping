# Superadmin Setup Guide

## 🚀 Initial System Setup

This guide explains how to create the first superadmin account for your BestDeal Shipping system.

---

## 📍 Endpoint

**POST** `/api/auth/create-superadmin`

### Swagger Documentation
Access the interactive API documentation at:
```
http://localhost:4001/api/docs
```
Look for the "Create first superadmin (One-time setup)" endpoint under the **Authentication** section.

---

## 🔐 How It Works

1. **One-Time Only**: This endpoint only works if NO admin or superadmin exists in the system
2. **Automatic Disable**: Once a superadmin is created, the endpoint returns a `403 Forbidden` error
3. **Full Access**: Superadmin has access to ALL endpoints and features
4. **Auto-Login**: Returns JWT tokens immediately after creation

---

## 📝 Request Body

```json
{
  "email": "admin@bestdeal.com",
  "password": "Admin@123",
  "name": "System Administrator"
}
```

### Field Requirements:
- **email**: Valid email format (will be used for login)
- **password**: Minimum 6 characters
- **name**: Your display name (minimum 2 characters)

---

## 🎯 Using Swagger UI

### Step 1: Open Swagger
Navigate to `http://localhost:4001/api/docs`

### Step 2: Find the Endpoint
Look for **POST /api/auth/create-superadmin** under the "Authentication" section

### Step 3: Try it Out
1. Click "Try it out"
2. Fill in the JSON request body:
```json
{
  "email": "admin@bestdeal.com",
  "password": "SecurePassword123!",
  "name": "Administrator"
}
```
3. Click "Execute"

### Step 4: Save the Response
You'll receive:
```json
{
  "success": true,
  "message": "Superadmin created successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@bestdeal.com",
      "name": "Administrator",
      "role": "superadmin",
      "createdAt": "2025-10-20T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**⚠️ IMPORTANT**: Save the `token` - you'll need it to authenticate other requests!

---

## 🔑 Using the Token

After creating your superadmin account, use the token to authenticate:

1. **In Swagger UI**:
   - Click the 🔒 "Authorize" button at the top
   - Enter: `Bearer YOUR_TOKEN_HERE`
   - Click "Authorize"

2. **In Postman or other tools**:
   - Add header: `Authorization: Bearer YOUR_TOKEN_HERE`

---

## ✅ Verification

To verify your superadmin was created successfully:

1. Use the **GET /api/auth/me** endpoint with your token
2. Check that the response shows `"role": "superadmin"`

---

## 🚫 Troubleshooting

### Error: "Superadmin already exists"
**Status**: 403 Forbidden
**Solution**: A superadmin has already been created. Use the `/api/auth/login` endpoint instead.

### Error: "User with this email already exists"
**Status**: 400 Bad Request
**Solution**: Choose a different email address.

### Error: "Validation error"
**Status**: 400 Bad Request
**Solution**: Ensure all required fields are provided and meet the minimum requirements.

---

## 🔄 Next Steps

After creating your superadmin:

1. **Login normally**: Use `/api/auth/login` endpoint
2. **Create other admins**: Use `/api/auth/send-invite` to invite other team members
3. **Manage users**: Use `/api/auth/users` to view all users
4. **Full system access**: Superadmin can access ALL endpoints

---

## 🛡️ Security Notes

- **Change the password**: After initial setup, consider changing to a more secure password
- **Limit superadmin accounts**: Create regular admin accounts for day-to-day operations
- **Keep tokens secure**: Never share or commit JWT tokens to version control
- **Token expiry**: Access tokens expire in 24 hours, refresh tokens in 7 days

---

## 📚 Related Endpoints

- **POST /api/auth/login** - Login with your superadmin credentials
- **POST /api/auth/send-invite** - Invite new team members
- **GET /api/auth/users** - View all users
- **GET /api/auth/me** - Get current user profile

---

## 💡 Example cURL Command

```bash
curl -X POST http://localhost:4001/api/auth/create-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bestdeal.com",
    "password": "SecurePassword123!",
    "name": "System Administrator"
  }'
```

---

**Happy shipping! 📦**

