# NitroPing iOS

iOS demo uygulaması ve SDK paketi for NitroPing push notification service.

## 📁 Yapı

```
ios/
├── package/               # NitroPing iOS SDK (Swift Package)
│   ├── Package.swift
│   ├── README.md
│   └── Sources/
│       └── NitroPingClient/
│           ├── NitroPingClient.swift
│           └── AppDelegate+NitroPing.swift
│
└── nitroping/            # Demo iOS Uygulaması
    ├── nitroping.xcodeproj/
    └── nitroping/
        ├── nitropingApp.swift
        ├── ContentView.swift
        ├── AppDelegate.swift
        ├── NitroPingService.swift
        └── Info.plist
```

## 🚀 Demo Uygulamayı Çalıştırma

### 1. Xcode ile Açma
```bash
cd ios/nitroping
open nitroping.xcodeproj
```

### 2. Gereksinimler
- iOS 15.0+
- Xcode 15.0+
- Physical device (Push notifications simulator'da çalışmaz)

### 3. Kurulum
1. Xcode'da projeyi aç
2. Team ve Bundle ID ayarla (Signing & Capabilities)
3. Push Notifications capability'yi etkinleştir
4. Physical device'ta çalıştır

## 📱 Demo App Özellikleri

### Ana Ekran
- **Device Token Display:** APNS device token'ını gösterir
- **Copy Button:** Token'ı panoya kopyalar
- **User ID Management:** User ID güncelleme
- **Notification Stats:** Alınan bildirim sayısı
- **Last Notification:** Son gelen bildirimin detayları
- **Test Instructions:** Adım adım test rehberi

### Push Notification Handling
- Otomatik permission request
- Device token alma ve gösterme
- NitroPing API'ye device kaydetme
- Foreground/background notification handling
- Notification data görüntüleme

## 🔧 NitroPing Server Konfigürasyonu

Demo app varsayılan olarak `localhost:3000`'e bağlanır.

### AppDelegate.swift'te API URL güncelle:
```swift
private let apiURL = "http://localhost:3000/api/graphql"
private let appId = "your-app-id-here" // ⚠️ Gerçek app ID ile değiştir
```

### Production için:
```swift
private let apiURL = "https://your-nitroping-server.com/api/graphql"
```

## 📋 Test Adımları

### 1. Device Token Alma
1. Demo app'i physical device'ta çalıştır
2. Push notification permission'ı ver
3. Device token'ı kopyala (ekrandaki "Kopyala" butonu)

### 2. NitroPing'e Device Kaydetme
1. NitroPing web dashboard'a git
2. Apps → [Your App] → Devices
3. "Add Device" butonuna tıkla
4. Token'ı yapıştır, platform "ios" seç

### 3. Test Notification Gönderme
1. Send Notification sayfasına git
2. Title ve body gir
3. Platform olarak "ios" seç
4. Target devices olarak device'ını seç
5. "Send" butonuna tıkla

### 4. Notification Alma
- App foreground'daysa: Banner gösterilir + app içi stats güncellenir
- App background'daysa: System notification gösterilir
- Notification'a tap: App açılır + stats güncellenir

## 🛠️ SDK Kullanımı

Kendi iOS uygulamanızda NitroPing SDK'yı kullanmak için:

### 1. Package Dependency Ekleme
```swift
// Package.swift
dependencies: [
    .package(path: "../ios/package") // veya .package(url: "...")
]
```

### 2. Import
```swift
import NitroPingClient
```

### 3. Kurulum
```swift
// AppDelegate.swift
@UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

class AppDelegate: NSObject, UIApplicationDelegate {
    var nitroPingClient: NitroPingClient?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        nitroPingClient = NitroPingClient(
            apiURL: "https://your-server.com/api/graphql",
            appId: "your-app-id"
        )
        
        Task {
            try await nitroPingClient?.initialize(userId: "user-123")
        }
        
        return true
    }
}
```

## ⚠️ Önemli Notlar

### APNS Configuration
- Development build → Development APNS certificate/key
- Production build → Production APNS certificate/key  
- Bundle ID mutlaka NitroPing APNS ayarlarıyla eşleşmeli

### Network Security
- `Info.plist`'te App Transport Security localhost için devre dışı
- Production'da HTTPS kullanın

### Device Token
- Her app installation'ında farklı
- App restore'da değişebilir
- Development vs Production build'de farklı

## 🔍 Troubleshooting

### "Permission Denied"
- iPhone Settings → [App Name] → Notifications → Allow

### "Registration Failed"
- NitroPing server çalışıyor mu kontrol et
- API URL doğru mu kontrol et
- Network connectivity kontrol et

### "No Device Token"
- Physical device kullanıyor musunuz?
- Simulator push notification desteklemez
- Provisioning profile doğru mu?

### APNS Errors
- Certificate/key doğru mu?
- Bundle ID eşleşiyor mu?
- Development vs Production environment doğru mu?

## 📚 Daha Fazla Bilgi

- [APNS Documentation](https://developer.apple.com/documentation/usernotifications)
- [Push Notification Best Practices](https://developer.apple.com/design/human-interface-guidelines/notifications)
- [NitroPing Server Documentation](../../README.md)