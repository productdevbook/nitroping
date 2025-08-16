//
//  ContentView.swift
//  nitroping
//
//  Created by code on 16.08.2025.
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appDelegate: AppDelegate
    @State private var userId = "demo-user"
    @State private var showingTokenCopied = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "bell.badge.fill")
                            .font(.system(size: 64))
                            .foregroundColor(.blue)
                        
                        Text("NitroPing Demo")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("iOS Push Notification Test")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    
                    // Device Token Card
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Device Token")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            Button("Copy") {
                                UIPasteboard.general.string = appDelegate.deviceToken
                                showingTokenCopied = true
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(appDelegate.deviceToken.contains("loading") || 
                                    appDelegate.deviceToken.contains("failed") ||
                                    appDelegate.deviceToken.contains("denied"))
                        }
                        
                        Text(appDelegate.deviceToken)
                            .font(.system(.caption, design: .monospaced))
                            .padding(12)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                            .textSelection(.enabled)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 2)
                    .padding(.horizontal)
                    
                    // User ID Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("User ID")
                            .font(.headline)
                        
                        HStack {
                            TextField("Enter User ID", text: $userId)
                                .textFieldStyle(.roundedBorder)
                            
                            Button("Update") {
                                Task {
                                    await appDelegate.updateUserId(userId)
                                }
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 2)
                    .padding(.horizontal)
                    
                    // Stats Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Notification Statistics")
                            .font(.headline)
                        
                        HStack(spacing: 16) {
                            VStack {
                                Text("\(appDelegate.notificationCount)")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                Text("Received")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                            
                            VStack {
                                Text(appDelegate.lastNotification.isEmpty ? "None" : "Available")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                                Text("Last Notification")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 2)
                    .padding(.horizontal)
                    
                    // Last Notification Details
                    if !appDelegate.lastNotification.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Last Notification Details")
                                .font(.headline)
                            
                            ScrollView {
                                Text(formatNotificationData(appDelegate.lastNotification))
                                    .font(.system(.caption, design: .monospaced))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .textSelection(.enabled)
                            }
                            .frame(height: 120)
                            .padding(12)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                            
                            // Test Click Tracking Button
                            Button("Test Click Tracking") {
                                Task {
                                    await appDelegate.testClickTracking()
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .buttonStyle(.borderedProminent)
                            .disabled(appDelegate.lastNotification.isEmpty)
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(radius: 2)
                        .padding(.horizontal)
                    }
                    
                    // Instructions Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("How to Test")
                            .font(.headline)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(alignment: .top) {
                                Text("1.")
                                    .fontWeight(.bold)
                                    .frame(width: 20, alignment: .leading)
                                Text("Copy the device token above")
                            }
                            
                            HStack(alignment: .top) {
                                Text("2.")
                                    .fontWeight(.bold)
                                    .frame(width: 20, alignment: .leading)
                                Text("Go to NitroPing web dashboard")
                            }
                            
                            HStack(alignment: .top) {
                                Text("3.")
                                    .fontWeight(.bold)
                                    .frame(width: 20, alignment: .leading)
                                Text("Add the token in Devices page using 'Add Device'")
                            }
                            
                            HStack(alignment: .top) {
                                Text("4.")
                                    .fontWeight(.bold)
                                    .frame(width: 20, alignment: .leading)
                                Text("Send a test notification from Send Notification page")
                            }
                        }
                        .font(.subheadline)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 2)
                    .padding(.horizontal)
                    
                    Spacer()
                }
                .padding(.vertical)
            }
            .navigationTitle("NitroPing")
            .navigationBarTitleDisplayMode(.inline)
        }
        .alert("Token Copied!", isPresented: $showingTokenCopied) {
            Button("OK") { }
        } message: {
            Text("Device token copied to clipboard. You can now add the device in NitroPing dashboard.")
        }
    }
    
    private func formatNotificationData(_ data: [AnyHashable: Any]) -> String {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data, options: .prettyPrinted)
            return String(data: jsonData, encoding: .utf8) ?? "Invalid JSON"
        } catch {
            return data.description
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppDelegate())
}
