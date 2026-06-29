# FinSavior UI

Mobile-first React application for FinSavior, a personal finance app for tracking monthly bills, card expenses, income, goals, subscriptions, and AI-assisted financial insights.

This repository contains the web UI and Capacitor Android application shipped to users. It communicates with the FinSavior backend monolith for authentication, financial data, AI features, and subscription management.

## Main Features

- Bill, income, card, and recurring expense management.
- Monthly dashboard and recent activity views.
- Fixed bill recurrence options and real purchase date display.
- AI assistant chat, document import, and voice-based entry.
- Google authentication and secure session refresh flow.
- Stripe subscription checkout with web and native mobile support.
- Capacitor Android build for Play Store releases.

## Tech Stack

- React
- TypeScript
- Vite
- Capacitor
- Firebase Authentication
- Stripe.js
- Tailwind-style utility classes

## Local Development

Prerequisites:

- Node.js
- npm
- Android Studio and JDK 21 for native Android builds

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the web application:

```bash
npm run build
```

## Android Release

The Android project lives under `android/`. Release signing values are read from `android/local.properties`, and the application version is configured in `android/app/build.gradle`.
