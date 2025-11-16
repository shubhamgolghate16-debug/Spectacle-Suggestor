**✨ Features**
- **Spectacle Suggester:**
   - **Camera & Upload:** Use your device's camera for a live photo or upload an existing one.
   - **AI Face Analysis:** The Gemini model analyzes your facial features to determine your face shape.
   - **Personalized Recommendations:** Receive 5 unique spectacle style suggestions tailored to you.
   - **Virtual Try-On:** See AI-generated images of how each recommended style and color would look on your face.
   - **Detailed Style Cards:** Each suggestion includes the style name, color, a short description, and a clear reason why it complements your features.
---
**🛠️ Tech Stack**
- **Frontend:** React with TypeScript, styled with Tailwind CSS.
- **AI Model:** Google Gemini API (gemini-2.5-flash for analysis and gemini-2.5-flash-image for image generation/editing).
- **Bundling/Setup:** Vite
---
**🔧 Getting Started (For Developers)**

**1. Clone the repository:**
````bash
git clone https://github.com/your-username/ai-vision-stylist.git
cd ai-vision-stylist
````

**2. Install Dependencies**
````bash
npm install
````
**3. Set up environment variables:**
Create a file named .env in the root of the project.
Obtain an API key from Google AI Studio.
Add your API key to the .env file:
````bash
API_KEY=YOUR_GEMINI_API_KEY
````

**4. Run Dependencies**
````bash
npm run dev
````

The application should now be running on your local server
