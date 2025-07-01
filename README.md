
<img width="973" alt="Screenshot 2025-04-21 at 10 13 19 AM" src="https://github.com/user-attachments/assets/cdf97ccb-4040-4e12-8848-3b86bb463729" />

# DeGen.AI - AI-Powered Data Management Platform

DeGen.AI is a comprehensive, AI-powered data management and analysis platform built with React and TypeScript. It provides a suite of tools for data generation, processing, analysis, and visualization, all enhanced by OpenAI's language models.

## 🚀 Features

### Core Data Tools
- **🎯 Synthetic Data Generation** - Generate realistic synthetic datasets with AI
- **📊 Data Augmentation** - Enhance existing datasets with intelligent augmentation
- **⏰ Time Series Analysis** - Create and analyze time-based data patterns
- **🛡️ PII Handling** - Detect and mask personally identifiable information
- **⚖️ Imbalanced Data Solutions** - Handle class imbalance with AI recommendations
- **🔍 Data Parsing & Extraction** - Parse and extract data from various sources
- **📈 Edge Case Detection** - Identify and generate edge cases for robust testing
- **🔎 Data Query Assistant** - Natural language to SQL query conversion

### AI-Powered Features
- **OpenAI Integration** - Leverages GPT models for intelligent data operations
- **Smart Schema Detection** - Automatically infer data schemas from samples
- **AI Recommendations** - Get expert suggestions for data handling strategies
- **Natural Language Processing** - Extract insights from unstructured text
- **Intelligent Masking** - Context-aware PII detection and masking

### Data Processing Capabilities
- **Multi-format Support** - JSON, CSV, Excel, and more
- **Real-time Analysis** - Live data processing and visualization
- **Batch Operations** - Handle large datasets efficiently
- **Export Options** - Multiple output formats for different use cases

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **Framer Motion** for smooth animations
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Hook Form** for form management

### Key Technologies
- **OpenAI API** integration for AI-powered features
- **Supabase** for authentication and data storage
- **Three.js** for 3D visualizations
- **Date-fns** for date manipulation
- **Papaparse** for CSV processing

### Component Architecture
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (buttons, cards, etc.)
│   ├── *Analysis.tsx    # Data analysis components
│   ├── *Generator.tsx   # Data generation components
│   └── *Dialog.tsx      # Modal dialogs
├── services/            # API and business logic
│   ├── openAiService.ts # OpenAI integration
│   ├── *Service.ts      # Feature-specific services
└── pages/               # Main application pages
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/degen-ai.git
   cd degen-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📖 Usage Guide

### Getting Started
1. **Authentication** - Sign up/login to access all features
2. **API Key Setup** - Configure your OpenAI API key in settings
3. **Choose a Tool** - Select from the available data tools

### Key Workflows

#### Synthetic Data Generation
```typescript
// Example: Generate user data
const options = {
  dataType: 'user',
  rowCount: 1000,
  fields: [
    { name: 'name', type: 'name', included: true },
    { name: 'email', type: 'email', included: true },
    { name: 'age', type: 'integer', included: true }
  ]
};
```

#### PII Detection and Masking
```typescript
// Automatically detect PII fields
const detectedPII = await detectPiiInData(dataset, apiKey);

// Apply intelligent masking
const maskedData = await maskPiiData(
  data, 
  maskingOptions, 
  { preserveFormat: true }
);
```

#### Time Series Analysis
```typescript
// Generate time series data
const timeSeriesData = await generateTimeSeriesWithAI({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  interval: 'daily',
  trend: 'seasonal'
});
```

### Data Formats Supported
- **JSON** - Structured data exchange
- **CSV** - Tabular data import/export
- **Excel** - Spreadsheet compatibility
- **Parquet** - Columnar data format

## 🔧 Configuration

### OpenAI Models
The platform supports multiple OpenAI models:
- **GPT-4o** (Recommended) - Best performance
- **GPT-4 Turbo** - Balanced cost/performance
- **GPT-3.5 Turbo** - Cost-effective option

### Customization Options
- **Theme Support** - Light/dark mode toggle
- **Model Selection** - Choose appropriate AI model
- **Data Preferences** - Configure default settings
- **Export Formats** - Customize output options

## 🎨 UI Components

### Design System
- **Consistent Theming** - Unified color palette and typography
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG compliant components
- **Animation Library** - Smooth transitions and interactions

### Key Components
- `DatasetAnalysis` - AI-powered dataset insights
- `SyntheticDataGenerator` - Data generation interface
- `TimeSeriesChart` - Interactive time series visualization
- `EdgeCaseDetector` - ML edge case identification
- `PiiDataGenerator` - PII-aware data creation

## 🔒 Security & Privacy

### Data Protection
- **Local Processing** - Sensitive operations run client-side
- **API Key Security** - Encrypted storage of credentials
- **PII Detection** - Automatic identification of sensitive data
- **Masking Options** - Multiple anonymization techniques

### Privacy Features
- **No Data Retention** - Platform doesn't store user data
- **Secure Transmission** - HTTPS for all API calls
- **User Control** - Full control over data processing

## 📈 Performance

### Optimization Features
- **Lazy Loading** - Components load on demand
- **Memoization** - Prevent unnecessary re-renders
- **Batch Processing** - Handle large datasets efficiently
- **Progress Tracking** - Real-time operation feedback

### Scalability
- **Client-side Processing** - Reduces server load
- **Streaming Support** - Handle large file uploads
- **Caching Strategies** - Optimize API usage

### Code Standards
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code quality enforcement
- **Prettier** - Consistent code formatting
- **Component Testing** - Test coverage for critical components

### Areas for Contribution
- 🐛 Bug fixes and improvements
- ✨ New data generation algorithms
- 📊 Additional visualization options
- 🌐 Internationalization support
- 📱 Mobile app development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


**DeGen.AI** - Transforming data management with artificial intelligence 🚀
