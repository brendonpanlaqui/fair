# Fair App 🚲

Fair is a React Native mobile application built with Expo, designed to help commuters in Angeles City calculate accurate tricycle fares using GPS tracking. The app ensures compliance with Angeles City LGU Ordinance No. 723 and provides tools for verifying LGU discounts and reporting driver disputes.

## 🌟 Features

- **GPS Fare Calculation:** Automatically calculate tricycle fares based on distance (base fare of ₱35.00 for the first kilometer, +₱15.00/km succeeding).
- **Discount Verification:** Apply for mandatory 20% LGU discounts (Student, Senior Citizen, PWD) by securely uploading valid IDs.
- **Commuter Rights & Protection:** Guidelines for handling disputes and the ability to submit GPS map-trace reports against overcharging drivers.
- **Account Management:** Securely manage personal details and passwords.

## 🛠 Tech Stack

- **Frontend:** React Native, Expo, TypeScript
- **Backend (API):** Django REST Framework

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
