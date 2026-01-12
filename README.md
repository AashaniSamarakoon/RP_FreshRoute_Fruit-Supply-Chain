# FreshRoute Fruit Supply Chain

A comprehensive mobile application built with React Native and Expo for managing the fruit supply chain, connecting farmers, buyers, and transporters in a seamless digital ecosystem.

## Description

FreshRoute is a mobile app designed to revolutionize the fruit supply chain by providing a digital platform for farmers to list their produce, buyers to place orders, and transporters to handle logistics. The app features real-time tracking, quality verification, complaint management, and multilingual support (English and Sinhala).

## Features

- **Multi-Role Support**: Separate interfaces for Farmers, Buyers, and Transporters
- **Real-Time Tracking**: GPS-based location tracking for deliveries
- **Quality Verification**: Fruit grading and digital passport system
- **Complaint Management**: Camera-based complaint filing and tracking
- **Price Comparison**: Real-time market price analysis
- **Multilingual**: Support for English and Sinhala languages
- **Offline Support**: Async storage for offline functionality
- **Push Notifications**: Real-time alerts for orders and updates
- **Secure Authentication**: Supabase-based user authentication
- **Cross-Platform**: Runs on iOS, Android, and Web

## Architecture

### Project Structure

```
freshroute-mobile/
├── app/                          # Main application code (Expo Router)
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Landing page
│   ├── login.tsx                # Authentication
│   ├── signup.tsx               # User registration
│   ├── modal.tsx                # Modal components
│   ├── add-details.tsx          # Additional user details
│   ├── buyer/                   # Buyer-specific screens and components
│   │   ├── _layout.tsx
│   │   ├── (tabs)/              # Tab navigation for buyers
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx        # Buyer dashboard
│   │   │   ├── orders.tsx       # Order management
│   │   │   ├── freshroutePrices.tsx # Price comparison
│   │   │   └── profile.tsx      # User profile
│   │   ├── components/          # Buyer-specific components
│   │   │   ├── DealCard.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   ├── PriceComparisonChart.tsx
│   │   │   └── ...
│   │   ├── forms/               # Form hooks and logic
│   │   ├── screens/             # Additional screens
│   │   └── styles/              # Buyer-specific styles
│   ├── farmer/                  # Farmer-specific screens and components
│   │   ├── _layout.tsx
│   │   ├── (tabs)/
│   │   ├── components/
│   │   ├── forms/
│   │   ├── screens/
│   │   └── styles/
│   └── transporter/             # Transporter-specific screens and components
│       ├── _layout.tsx
│       ├── details.tsx
│       ├── final-order.tsx
│       ├── fruit-grading.tsx
│       ├── route.tsx
│       ├── verification-results.tsx
│       ├── (tabs)/
│       ├── components/
│       ├── job/
│       └── map/
├── assets/                      # Static assets
│   ├── images/                  # App icons, splash screens
│   └── svgs/                    # SVG icons and illustrations
├── components/                  # Shared components
│   ├── ui/                      # UI primitives
│   ├── modals/                  # Modal components
│   └── ...                      # Other shared components
├── constants/                   # App constants and themes
├── context/                     # React contexts for state management
├── data/                        # Mock data and static data
├── hooks/                       # Custom React hooks
├── i18n/                        # Internationalization
│   ├── config.ts
│   └── locales/                 # Translation files
├── scripts/                     # Utility scripts
├── services/                    # API services and clients
├── types/                       # TypeScript type definitions
├── utils/                       # Utility functions
├── android/                     # Android-specific configuration
├── config.js                    # App configuration
├── package.json                 # Dependencies and scripts
├── app.json                     # Expo configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.js             # ESLint configuration
└── expo-env.d.ts                # Expo environment types
```

### Technology Stack

- **Frontend**: React Native, Expo
- **Navigation**: Expo Router
- **State Management**: React Context
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Maps**: React Native Maps, Mapbox
- **Camera**: Expo Camera
- **Storage**: AsyncStorage
- **Internationalization**: i18next, react-i18next
- **Icons**: Lucide React Native, Expo Vector Icons
- **Build Tools**: Expo CLI, Gradle (Android)

### Role-Based Architecture

The app implements a role-based architecture with separate feature sets:

1. **Farmers**: List produce, manage inventory, view orders, handle complaints
2. **Buyers**: Browse produce, place orders, track deliveries, file complaints
3. **Transporters**: Accept jobs, navigate routes, perform quality checks, update delivery status

Each role has its own navigation structure, components, and business logic while sharing common utilities and services.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Git** - For cloning the repository
- **Android Studio** (for Android development) - [Download](https://developer.android.com/studio)
- **Xcode** (for iOS development on macOS) - [Download](https://developer.apple.com/xcode/)

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/freshroute-mobile.git
   cd freshroute-mobile
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory and add your Supabase credentials:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Update `config.js` with your backend URL:

   ```javascript
   export const BACKEND_URL = "http://your-local-backend-ip:4000";
   ```

4. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to the environment variables
   - Set up the required database tables and policies as per your backend requirements

## Running the App

### Development Mode

1. **Start the Expo development server**:

   ```bash
   npm start
   # or
   expo start
   ```

2. **Run on specific platform**:

   - **Android**: `npm run android` or `expo run:android`
   - **iOS**: `npm run ios` or `expo run:ios` (macOS only)
   - **Web**: `npm run web` or `expo start --web`

3. **Scan QR code**: Use the Expo Go app on your phone to scan the QR code displayed in the terminal.

### Building for Production

1. **Build for Android**:

   ```bash
   expo build:android
   ```

2. **Build for iOS**:

   ```bash
   expo build:ios
   ```

3. **Web build**:
   ```bash
   expo export --platform web
   ```

## Usage

1. **Launch the app** and select your role (Farmer, Buyer, or Transporter)
2. **Sign up/Login** using your credentials
3. **Navigate through the app** using the bottom tabs and screens specific to your role
4. **Perform actions** like placing orders, listing produce, or accepting delivery jobs

### Key Workflows

- **Farmers**: Add produce listings, monitor orders, respond to complaints
- **Buyers**: Browse available produce, compare prices, place orders, track deliveries
- **Transporters**: View available jobs, navigate routes, perform quality checks

## Testing

Run the linter to check code quality:

```bash
npm run lint
```

For unit testing (if implemented):

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Code Style

- Follow the existing ESLint configuration
- Use TypeScript for type safety
- Follow React Native and Expo best practices
- Write meaningful commit messages

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo r -c`
2. **Android build failures**: Ensure Android SDK is properly configured
3. **iOS build failures**: Ensure Xcode and iOS Simulator are set up
4. **Supabase connection issues**: Verify environment variables and network connectivity

### Reset Project

If you encounter persistent issues, reset the project:

```bash
npm run reset-project
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact the development team or create an issue in the repository.

---

Built with ❤️ using React Native and Expo
