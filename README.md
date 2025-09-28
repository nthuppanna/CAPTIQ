# CAPTIQ - AI-Powered Social Media Content Generator

A complete social media content generation platform that combines Cedar-OS UI components with Mastra AI agents to create captions and graphics for sports teams.

## 🚀 Features

- **AI-Generated Captions**: Create engaging social media captions using Mastra agents
- **Dynamic Graphics Generation**: Generate visual content with customizable text and colors
- **Interactive Preview**: Double-click graphics to preview and modify them
- **Real-time Modification**: Change text colors and styles on the fly
- **Cedar-OS Integration**: Beautiful, modern UI components
- **Fallback Mechanisms**: Robust error handling and rate limit management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Cedar-OS components, Tailwind CSS
- **AI Backend**: Mastra agents with Gemini API
- **Styling**: Tailwind CSS with custom animations

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cedar-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the Mastra backend** (in a separate terminal)
   ```bash
   cd src/backend
   npm install
   mastra dev
   ```

## 🎯 Usage

1. **Open the application** at `http://localhost:3000`
2. **Enter a keyword** for your content (e.g., "championship", "game day")
3. **Generate captions** using the "Regenerate Captions" button
4. **Generate graphics** using the "Regenerate Graphics" button
5. **Preview graphics** by double-clicking on them
6. **Modify graphics** using the "Graphic Modification" input box

## 🏗️ Project Structure

```
cedar-backend/
├── pages/
│   ├── api/                 # API endpoints
│   │   ├── captions/        # Caption generation APIs
│   │   └── graphics/        # Graphics generation APIs
│   └── index.tsx           # Main application page
├── src/
│   ├── App.tsx             # Main CAPTIQ application
│   ├── lib/                # Client libraries
│   └── backend/            # Mastra backend
│       ├── src/mastra/     # Mastra agents
│       └── mastra.config.ts
├── cedar/                  # Cedar-OS components
└── public/                 # Static assets
```

## 🔧 API Endpoints

- `POST /api/captions/generate` - Generate social media captions
- `POST /api/graphics/generate` - Generate graphics with text
- `POST /api/graphics/modify` - Modify existing graphics
- `POST /api/captions/mastra` - Mastra caption agent (experimental)

## 🎨 Graphics Features

- **Text Variations**: Multiple text options for each keyword
- **Color Customization**: Change text colors (blue, red, green, yellow, purple, orange)
- **Preview System**: Double-click to preview graphics in full size
- **Modification Interface**: Real-time graphic editing

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**
   - Ensure the backend server is running on port 3002
   - Check that the Mastra backend is running on port 4114

2. **Graphics not generating**
   - Verify your Gemini API key is valid
   - Check the browser console for error messages

3. **Styling issues**
   - Run `npm install` to ensure all dependencies are installed
   - Clear browser cache and refresh

### Development Tips

- Use the browser developer tools to monitor API calls
- Check the terminal for backend logs
- The application includes fallback mechanisms for API failures

## 📝 License

This project is part of a hackathon submission and is available for educational purposes.

## 🤝 Contributing

This is a hackathon project. For questions or issues, please refer to the project documentation or contact the development team.

---

**Note**: This application requires both the Next.js frontend and Mastra backend to be running simultaneously for full functionality.