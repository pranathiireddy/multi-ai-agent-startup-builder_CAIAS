Startup Forge (Multi AI Agent Startup Builder)

An AI-powered platform designed to help users transform ideas into structured startup plans using a multi-agent architecture.

Built with a modern technology stack including React, TypeScript, Vite, and Firebase, this project focuses on delivering a fast, scalable, and intuitive user experience.

---
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://aistudio.google.com/apps/8d580bf9-5bc4-4ee4-a4a3-392c36c5219e?showAssistant=true&project=gen-lang-client-0896774919&showPreview=true&fullscreenApplet=true

Overview

This application simulates a startup-building environment where multiple AI-driven components collaborate to:

- Analyze startup ideas
- Generate business strategies
- Provide structured outputs
- Assist users with execution planning

It is particularly useful for:

- Students
- Hackathon participants
- Beginner entrepreneurs

---

Tech Stack

Frontend

- React (with TypeScript)
- Vite
- HTML and CSS

Backend / Services

- Firebase
  - Firestore (database)
  - Configuration and security rules
  - Hosting (optional)

Configuration

- Environment variables (.env)
- TypeScript configuration (tsconfig.json)
- Vite configuration (vite.config.ts)

---

Project Structure

├── src/                # Main application logic (components, modules)
├── index.html          # Entry point
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules     # Firebase security rules
├── .env.example        # Environment variables template

---

Features

AI-Powered Startup Builder

- Accepts user startup ideas
- Processes input through AI-based logic
- Generates structured and meaningful outputs

Modular Multi-Agent Design

- Logical separation of responsibilities such as:
  - Idea validation
  - Strategy generation
  - Planning
- Easily extendable into a full multi-agent system

Firebase Integration

- Supports backend functionality such as:
  - Data storage
  - Scalable configuration

High Performance

- Powered by Vite for fast development and optimized builds

User Interface

- Clean and structured interface
- Focused on usability and clarity

---

APIs Used

- AI API (via environment variables)
  - OpenAI / Gemini (depending on configuration)
- Firebase APIs
  - Firestore
  - Configuration and security rules

---

Application Flow

User Input (Startup Idea)
        ↓
Frontend Processing (React Components)
        ↓
AI API Call
        ↓
Response Handling
        ↓
Display Results in UI

---

How to Run Locally

1. Clone the repository

git clone https://github.com/pranathiireddy/multi-ai-agent-startup-builder_CAIAS.git
cd multi-ai-agent-startup-builder_CAIAS

2. Install dependencies

npm install

3. Set up environment variables

Create a ".env" file:

VITE_API_KEY=your_api_key

4. Run the development server

npm run dev

---

Future Improvements

- Autonomous multi-agent orchestration with dynamic role assignment
- Integration of fine-tuned domain-specific AI models for specialized decision-making
- Real-time adaptive learning based on user interactions and feedback loops
- Cross-platform deployment with scalable microservices architecture
- Integration with external ecosystems (financial tools, analytics platforms, productivity suites)
- Advanced simulation engine for startup success prediction using data-driven modeling

---

Final Note

This project demonstrates how modern frontend technologies combined with AI and cloud services can be used to build scalable applications for startup development and idea validation.

---


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
