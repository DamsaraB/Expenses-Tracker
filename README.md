# Personal Finance Management App

A comprehensive Personal Finance Management app built with Expo, React Native, and TypeScript.

## Features

### Authentication
- **Login Screen**: Email/password authentication with validation
- **Signup Screen**: User registration with form validation

### Main App Screens
- **Home Screen**: Financial overview with quick actions and recent transactions
- **Expenses Screen**: Track and manage expenses with categories
- **Budget Screen**: Monitor monthly budgets and spending limits
- **Savings Screen**: Set and track savings goals with progress indicators
- **Reports Screen**: Visual analytics and financial reports

## Tech Stack

- **Framework**: Expo with React Native
- **Language**: TypeScript
- **Navigation**: Expo Router with Stack and Tab Navigation
- **UI Components**: Custom components with React Native
- **Icons**: Expo Vector Icons (Ionicons)

## Project Structure

```
├── app/                          # App screens and navigation
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── _layout.tsx          # Tab navigation setup
│   │   ├── index.tsx            # Home screen
│   │   ├── expenses.tsx         # Expenses screen
│   │   ├── budget.tsx           # Budget screen
│   │   ├── savings.tsx          # Savings screen
│   │   └── reports.tsx          # Reports screen
│   ├── Login.tsx                # Login screen
│   ├── Signup.tsx               # Signup screen
│   └── _layout.tsx              # Root navigation setup
├── components/                   # Reusable components
│   └── ui/                      # UI components
│       ├── Button.tsx           # Custom button component
│       ├── Card.tsx             # Card container component
│       ├── Input.tsx            # Input field component
│       └── index.ts             # Component exports
├── types/                       # TypeScript type definitions
│   └── index.ts                 # All app types and interfaces
├── data/                        # Mock data and constants
│   └── mockData.ts              # Sample data for development
└── constants/                   # App constants and themes
    └── theme.ts                 # Color and theme definitions
```

## Navigation Flow

1. **Authentication Flow**:
   - App starts with Login screen
   - Users can navigate to Signup screen
   - After successful login, users are redirected to main app

2. **Main App Flow**:
   - Bottom tab navigation with 5 screens
   - Home (overview), Expenses, Budget, Savings, Reports
   - Each screen has its own functionality and data

## Key Features

### Home Screen
- Monthly financial summary
- Quick action buttons
- Recent transactions list
- Budget progress indicators

### Expenses Screen
- Add, edit, and delete expenses
- Category-based organization
- Real-time expense tracking
- Visual expense breakdown

### Budget Screen
- Monthly budget overview
- Category-wise budget tracking
- Progress indicators
- Budget tips and recommendations

### Savings Screen
- Multiple savings goals
- Progress tracking with visual indicators
- Goal management (add, edit, delete)
- Savings tips and insights

### Reports Screen
- Visual charts and analytics
- Expense breakdown by category
- Budget performance metrics
- Savings progress overview
- Export and sharing capabilities

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   ```bash
   npm run ios      # iOS simulator
   npm run android  # Android emulator
   npm run web      # Web browser
   ```

## Development Notes

- All screens use TypeScript for type safety
- Mock data is provided for development and testing
- Components are designed to be reusable and extensible
- Navigation is handled by Expo Router
- UI follows modern design principles with clean, minimal styling

## Future Enhancements

- Backend integration for real data
- User authentication with secure APIs
- Data persistence with local storage
- Push notifications for budget alerts
- Advanced analytics and insights
- Multi-currency support
- Expense categorization with ML
- Bill reminders and tracking