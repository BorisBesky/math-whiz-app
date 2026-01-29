# 🧙‍♂️ Math Whiz App

An intelligent, adaptive math education platform designed for 3rd and 4th grade students. Math Whiz combines gamification, AI-powered content generation, and personalized learning to make mathematics engaging and effective.
See live deployment at https://math-whiz-app.netlify.app/

## ✨ Features

### 🎯 Adaptive Learning Engine
- **Intelligent Difficulty Adjustment**: Advanced complexity engine that adapts to each student's performance
- **Personalized Progression**: Questions automatically adjust based on accuracy and response time
- **Topic-Specific Analytics**: Detailed performance tracking across different mathematical concepts

### 🧠 AI-Powered Content
- **Dynamic Story Problems**: Google Gemini AI generates contextual, engaging word problems
- **Interactive Explanations**: Comprehensive mathematical explanations with visual aids
- **Real-time Feedback**: Instant feedback system with hints and step-by-step guidance

### 📊 Progress Tracking & Gamification
- **Daily Goals**: Customizable learning objectives per topic
- **Achievement System**: Coins, streaks, and milestone rewards
- **Performance Dashboard**: Detailed analytics on strengths and areas for improvement
- **Grade-Specific Content**: Separate progress tracking for 3rd and 4th grade topics

### 📚 Comprehensive Curriculum

#### 3rd Grade Topics
- **Multiplication & Division**: Multi-digit operations and problem-solving
- **Fractions**: Addition, subtraction, equivalency, comparison, and simplification
- **Measurement & Data**: Area, perimeter, volume, and data interpretation

#### 4th Grade Topics (California Standards Aligned)
- **Operations & Algebraic Thinking (4.OA)**: Factors, multiples, patterns, and multiplicative comparisons
- **Number & Operations in Base Ten (4.NBT)**: Place value, rounding, and multi-digit arithmetic
- **Number & Operations - Fractions (4.NF)**: Mixed numbers, decimal notation, and fraction operations
- **Measurement & Data (4.MD)**: Unit conversions, line plots, angles, and geometric measurements
- **Geometry (4.G)**: Lines, angles, triangles, quadrilaterals, and symmetry

## 🛠 Technical Stack

### Frontend
- **React 19.1** - Modern UI framework with hooks and functional components
- **Tailwind CSS** - Utility-first styling framework
- **KaTeX** - Mathematical notation rendering
- **Lucide React** - Modern icon library

### Backend & Services
- **Firebase** - Authentication, Firestore database, and user management
- **Netlify Functions** - Serverless backend for AI integration
- **Google Gemini AI** - Dynamic content generation for story problems

### Development Tools
- **Create React App** - React development environment
- **Playwright** - End-to-end testing framework
- **ESLint** - Code quality and consistency

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Firestore enabled
- Google Gemini AI API key
- Netlify account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/math-whiz-app.git
   cd math-whiz-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with your configuration:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start development server**
   ```bash
   npm start
   ```

### Deployment

The app is configured for Netlify deployment with serverless functions:

```bash
npm run build
netlify deploy --prod
```

## 🏗 Architecture

### Adaptive Learning System
The app features a sophisticated complexity engine that:
- Analyzes student response patterns across time and accuracy
- Uses Welford's algorithm for statistical analysis
- Implements progressive difficulty scaling
- Maintains topic-specific performance history

### Database Architecture
The application uses Firebase Firestore with a multi-tenant structure. For detailed information about the data model, see:
- **[Firestore Data Model](./FIRESTORE_DATA_MODEL.md)** - Complete schema documentation
- **[Data Examples](./FIRESTORE_DATA_EXAMPLES.md)** - Sample data structures and queries

### Data Structure Overview
```javascript
// User progress is organized by grade and topic
{
  selectedGrade: "G3" | "G4",
  dailyGoalsByGrade: {
    G3: { [topic]: goalCount },
    G4: { [topic]: goalCount }
  },
  progressByGrade: {
    [date]: {
      G3: { [topic]: completedCount },
      G4: { [topic]: completedCount }
    }
  },
  answeredQuestions: [{
    topic: string,
    grade: "G3" | "G4",
    correct: boolean,
    timeSpent: number,
    complexity: number,
    timestamp: Date
  }]
}
```

### Content Management
- Modular topic structure in `/src/content/`
- Grade-specific question generators
- Reusable explanation components
- Mathematical rendering with KaTeX

## 📈 Performance Features

- **Intelligent Caching**: Optimized question generation and content loading
- **Progressive Web App**: Offline-capable with service worker support
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

## 🧪 Testing

```bash
# Run test suite
npm test

# Run browser integration tests
npm run test:browser

# Run comprehensive test suite
npm run test:comprehensive
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- California Department of Education for curriculum standards alignment
- Google Gemini team for AI capabilities
- KaTeX team for mathematical rendering
- Firebase team for backend infrastructure

---

**Math Whiz App** - Making mathematics magical, one problem at a time! ✨🔢

### How to Set an Admin User

To use the new admin functionality, you must designate a user as an admin. This is done by setting a "custom claim" on their Firebase account.

1.  **Create an Admin User in Firebase:**
    *   Go to your [Firebase Console](https://console.firebase.google.com/).
    *   Navigate to **Authentication** -> **Users** tab.
    *   Click **Add user** and create a user with an email and password. This will be your admin login.

2.  **Set Environment Variables Locally:**
    *   Create a file named `.env` in the root of your project if you don't already have one.
    *   Add your Firebase Admin SDK credentials to this file. You can get these from your Firebase project settings (Service Accounts -> Generate new private key).
    
        ```.env
        FIREBASE_PROJECT_ID="your-project-id"
        FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com"
        FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
        ```
    *   **IMPORTANT:** The `FIREBASE_PRIVATE_KEY` must be enclosed in quotes and have `\n` at the end of each line, as shown.

3.  **Run the `set-admin.js` Script:**
    *   Open your terminal in the project root.
    *   Run the script, passing the email of the user you just created as an argument:
    
        ```bash
        node set-admin.js your-admin-email@example.com
        ```

    *   The script will confirm that the user has been granted admin privileges. The user will have these privileges the next time they sign in.
