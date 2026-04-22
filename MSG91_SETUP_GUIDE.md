# MSG91 OTP Setup Guide

## Overview
This guide explains how to configure MSG91 SMS service for OTP authentication in your Flawlez application.

## Prerequisites
1. MSG91 Account - Sign up at https://msg91.com
2. MSG91 Auth Key - Get from your MSG91 dashboard
3. Sender ID - Approved sender ID from MSG91

## Backend Setup Steps

### 1. Update .env File
Add these environment variables to your backend `.env` file:

```env
# MSG91 SMS Configuration
MSG91_AUTH_KEY=your_msg91_auth_key_here
MSG91_SENDER_ID=FLAWLZ  # Your approved sender ID
MSG91_ROUTE=4           # 4 for transactional SMS (default)
MSG91_DEFAULT_COUNTRY=91 # Default country code (91 for India)

# Keep existing variables
ACCESS_TOKEN_SECRET=your_secret_key
DATABASE_URL=your_database_url
```

### 2. Get MSG91 Credentials

1. **Sign up/Login to MSG91**: Go to https://msg91.com
2. **Get Auth Key**: 
   - Go to your MSG91 dashboard
   - Navigate to "API" section
   - Copy your Auth Key
3. **Get Sender ID**:
   - Go to "Sender ID" section in dashboard
   - Create and get approval for a sender ID (e.g., FLAWLZ)
   - Use the approved sender ID in MSG91_SENDER_ID

### 3. Route Types
- **Route 4**: Transactional SMS (recommended for OTP)
- **Route 1**: Promotional SMS (not recommended for OTP)

## Phone Number Support

### International Numbers
The system automatically detects country codes for these countries:
- **1**: United States/Canada
- **91**: India
- **44**: United Kingdom
- **33**: France
- **49**: Germany
- **81**: Japan
- **86**: China
- **61**: Australia
- **55**: Brazil
- **27**: South Africa

### Phone Number Formats Accepted
- `+91 9876543210`
- `91 9876543210`
- `(555) 123-4567`
- `555-123-4567`
- `5551234567`

## Testing

### Without MSG91 (Development)
If MSG91 credentials are not configured, the system will:
- Generate OTP and save to database
- Log OTP to console for testing
- Return success without sending actual SMS

### With MSG91 (Production)
- OTP will be sent via SMS to user's phone
- Check MSG91 dashboard for delivery reports

## MSG91 API Details

### Endpoint
```
POST https://api.msg91.com/api/v2/sendsms
```

### Headers
```
authkey: your_auth_key
Content-Type: application/json
```

### Request Body Example
```json
{
  "sender": "FLAWLZ",
  "route": "4",
  "country": "91",
  "sms": [
    {
      "message": "Your Flawlez OTP is: 123456. This code will expire in 10 minutes.",
      "to": ["9876543210"]
    }
  ]
}
```

### Success Response
```json
{
  "message": "Message Sent successfully",
  "type": "success",
  "msgId": "123456789"
}
```

## Troubleshooting

### Common Issues

1. **Invalid Auth Key**
   - Check your MSG91 auth key in dashboard
   - Ensure no extra spaces or characters

2. **Sender ID Not Approved**
   - Sender ID must be approved by MSG91
   - Use approved sender ID in MSG91_SENDER_ID

3. **Route Not Available**
   - Ensure you have credits for the selected route
   - Route 4 (transactional) is recommended for OTP

4. **Country Code Issues**
   - Default country code is set to 91 (India)
   - Modify the `MSG91_DEFAULT_COUNTRY` env variable for other countries
   - The system auto-detects country codes for supported countries

### Error Codes
- `101`: Invalid Auth Key
- `102`: Invalid Sender ID
- `103`: Invalid Route
- `104`: Insufficient Balance
- `105`: Invalid Country Code

## Cost Information
- MSG91 charges per SMS
- Transactional SMS (Route 4) is typically cheaper than promotional
- Check MSG91 pricing for your region
- International SMS may cost more

## Next Steps
1. Get MSG91 account and credentials
2. Update your `.env` file with MSG91 variables
3. Test the signup/login flow
4. Monitor MSG91 dashboard for delivery reports
5. Check server logs for any errors
6. Add more country codes to the list if needed for your user base
