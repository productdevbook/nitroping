# NitroPing iOS Setup Guide

Complete setup guide for configuring and testing iOS push notifications with NitroPing.

## 📋 Prerequisites

- **Xcode 15.0+**
- **iOS 15.0+**
- **Physical iOS device** (Simulator doesn't support push notifications)
- **Apple Developer Account** (Free or Paid)
- **NitroPing server** running locally or deployed

## 🚀 Quick Start

### 1. Open the Project
```bash
cd ios/nitroping
open nitroping.xcodeproj
```

### 2. Configure Signing
1. Select your project in Xcode
2. Go to **Signing & Capabilities** tab
3. Select your **Team** from Apple Developer Account
4. Set a unique **Bundle Identifier** (e.g., `com.yourname.nitroping`)

### 3. Enable Push Notifications
1. In **Signing & Capabilities**, click **"+ Capability"**
2. Add **"Push Notifications"**
3. Add **"Background Modes"**
4. Under Background Modes, check **"Remote notifications"**

### 4. Update Configuration
Edit `NitroPingService.swift`:
```swift
private let apiURL = "http://localhost:3000/api/graphql" // Your server URL
private let appId = "your-app-id-here" // Your NitroPing app ID
```

### 5. Run on Physical Device
- Connect your iPhone/iPad
- Select your device in Xcode
- Build and run (⌘+R)

## 🔧 Detailed Configuration

### Apple Developer Portal Setup

#### 1. Create App ID
1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **"+"** to create new App ID
4. Select **App IDs** → **App**
5. Enter **Description** and **Bundle ID** (same as Xcode)
6. Under **Capabilities**, enable **Push Notifications**
7. Click **Continue** and **Register**

#### 2. Create Development Certificate (if needed)
1. **Certificates** → **Development**
2. Click **"+"** to create new certificate
3. Select **Apple Development**
4. Upload your Certificate Signing Request
5. Download and install the certificate

#### 3. Create Provisioning Profile
1. **Profiles** → **Development**
2. Click **"+"** to create new profile
3. Select **iOS App Development**
4. Choose your **App ID**
5. Select your **Development Certificate**
6. Select your **Device(s)**
7. Download and install the profile

### NitroPing Server Configuration

#### 1. Create App in NitroPing
1. Open NitroPing web dashboard
2. Go to **Apps** → **Create App**
3. Enter app details and note the **App ID**

#### 2. Configure APNS
1. Go to **Apps** → **[Your App]** → **Providers** → **APNS**
2. For **Development** testing:
   - You can use a development certificate (.p12) or authentication key (.p8)
   - Set **Environment** to **Development**
3. For **Production**:
   - Use production certificate or key
   - Set **Environment** to **Production**

**Using .p8 Key (Recommended):**
1. In Apple Developer Portal: **Keys** → Create new key
2. Enable **Apple Push Notifications service (APNs)**
3. Download the .p8 file
4. In NitroPing APNS config:
   - **Key ID**: From Apple Developer Portal
   - **Team ID**: Your Apple Developer Team ID
   - **Private Key**: Contents of .p8 file

## 📱 Testing Push Notifications

### 1. Get Device Token
1. Run the app on your physical device
2. Allow push notification permission when prompted
3. Copy the device token from the app (tap "Copy" button)

### 2. Register Device in NitroPing
1. Go to NitroPing dashboard
2. **Apps** → **[Your App]** → **Devices**
3. Click **"Add Device"**
4. Paste the device token
5. Select platform: **IOS** (note: uppercase)
6. Enter a user ID (optional)
7. Click **Save**

### 3. Send Test Notification
1. Go to **Send Notification** page
2. Select your app
3. Enter notification details:
   - **Title**: "Test Notification"
   - **Body**: "Hello from NitroPing!"
4. **Target**: Select your device or use "All iOS devices"
5. Click **Send**

### 4. Verify Reception
- **App in foreground**: Notification banner appears + stats update
- **App in background**: System notification appears
- **Tap notification**: App opens and stats update
- Check **Last Notification Details** in the app

## 🛠️ Troubleshooting

### Common Issues

#### "no valid aps-environment entitlement" Error
**Solution:**
1. Ensure **Push Notifications** capability is added in Xcode
2. Check that your provisioning profile includes push notifications
3. Verify your App ID has push notifications enabled
4. Clean build folder (⌘+Shift+K) and rebuild

#### "Permission Denied"
**Solution:**
1. Go to iPhone **Settings** → **[App Name]** → **Notifications**
2. Enable **Allow Notifications**
3. Restart the app

#### "Registration Failed" / Network Errors
**Solutions:**
1. Verify NitroPing server is running and accessible
2. Check the API URL in `NitroPingService.swift`
3. For localhost, ensure your device and Mac are on the same network
4. Consider using your Mac's IP address instead of `localhost`

#### No Device Token Received
**Check:**
1. Using a **physical device** (not simulator)
2. **Internet connection** is available
3. **Push Notifications** capability is properly configured
4. **Provisioning profile** is up to date

#### APNS Delivery Failed
**Verify:**
1. **Bundle ID** matches between Xcode, Apple Developer Portal, and NitroPing
2. **Certificate/Key** is for the correct environment (development vs production)
3. **App ID** in NitroPing matches your configuration
4. **Device token** is valid and not expired

### Development vs Production

| Environment | Xcode Build | APNS Endpoint | Certificate Type |
|-------------|-------------|---------------|------------------|
| Development | Debug build from Xcode | Sandbox | Development |
| Production | App Store build | Production | Production |

### Network Configuration

#### For Localhost Development:
```swift
// Find your Mac's IP address
// Terminal: ifconfig | grep "inet "
private let apiURL = "http://192.168.1.100:3000/api/graphql" // Replace with your IP
```

#### For Production:
```swift
private let apiURL = "https://your-nitroping-server.com/api/graphql"
```

## 🔍 Debugging Tips

### Enable Detailed Logging
Add this to `AppDelegate.swift`:
```swift
func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ Detailed APNS Error: \(error)")
    print("❌ Error Code: \((error as NSError).code)")
    print("❌ Error Domain: \((error as NSError).domain)")
}
```

### Check Notification Settings
```swift
// Add this to debug permission issues
UNUserNotificationCenter.current().getNotificationSettings { settings in
    print("📱 Authorization Status: \(settings.authorizationStatus.rawValue)")
    print("📱 Alert Setting: \(settings.alertSetting.rawValue)")
    print("📱 Badge Setting: \(settings.badgeSetting.rawValue)")
    print("📱 Sound Setting: \(settings.soundSetting.rawValue)")
}
```

### Verify APNS Connection
Use Apple's APNS testing tool or online APNS testers to verify your certificates work independently of NitroPing.

## 📚 Additional Resources

- [Apple Push Notifications Documentation](https://developer.apple.com/documentation/usernotifications)
- [APNS Provider API](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [Troubleshooting Push Notifications](https://developer.apple.com/documentation/usernotifications/handling_notification_responses_from_the_user)
- [NitroPing Server Documentation](../README.md)

## 🎯 Production Checklist

Before deploying to production:

- [ ] Switch to production APNS certificates/keys
- [ ] Update API URL to production server
- [ ] Test with production build (not development)
- [ ] Verify push notifications work in production environment
- [ ] Set up proper error monitoring and logging
- [ ] Configure rate limiting for API calls
- [ ] Set up certificate/key rotation schedule