//
//  nitropingApp.swift
//  nitroping
//
//  Created by code on 16.08.2025.
//

import SwiftUI

@main
struct nitropingApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appDelegate)
        }
    }
}
