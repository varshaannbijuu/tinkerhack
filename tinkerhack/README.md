# 🧠 Focus Pet

> **Focus, Learn, and Keep Your Pet Alive!** 🐶🐱🐹

**Focus Pet** is an intelligent, gamified study companion built for the TinkerHack Hackathon. It transforms solitary studying into an engaging mission where your focus directly impacts the health of a virtual pet.

## 🌟 Why This Project?

We all struggle with procrastination and distraction. Focus Pet solves this by:
1.  **Personalizing Content**: Adapting to *your* learning style (Visual, Auditory, Read/Write, Kinesthetic).
2.  **Gamifying Focus**: Adding stakes to your study session—if you switch tabs or lose focus, your pet loses health!
3.  **Reducing Friction**: "Analyzing" your materials to generate a tailored study plan instantly.

## ✨ Key Features

-   **🧠 Learning Style Assessment**: A 10-question quiz determines your optimal learning path.
-   **🐕 Virtual Companion**: Adopt a **Puppy (Stacky)**, **Kitten (Git)**, or **Hamster (Pixel)**.
-   **❤️ Health Mechanic**: Your pet's HP correlates with your screen time on the study dashboard.
    -   **Focus**: Pet heals.
    -   **Distraction**: Pet takes damage on tab switch/blur.
-   **📚 Adaptive Dashboard**:
    -   **Visual Learners**: Video feeds & diagrams.
    -   **Audio Learners**: Podcasts & lectures.
    -   **Readers**: Smart summaries & structured notes.
    -   **Doers**: Quizzes & practical tasks.
-   **📂 Document Analysis**: Upload PDFs/PPTs to generate context-aware resources.

## 🚀 How It Works

1.  **Quiz**: Take the assessment to find your style.
2.  **Adopt**: Choose a companion to keep you accountable.
3.  **Setup**: Upload your study material (e.g., `Biology_Notes.pdf`).
4.  **Session**: The AI "scrapes" resources and builds a dashboard. **Stay on this page** to keep your pet alive!

## 🛠️ Tech Stack

-   **Frontend**: Svelte
-   **Build Tool**: Vite
-   **Styling**: Custom CSS (Animations & Responsive Layout)
-   **State Management**: Svelte Stores (Local State)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/varshaannbijuu/tinkerhack.git
    cd tinkerhack
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the app**
    ```bash
    npm run dev
    ```

4.  **Start Studying**
    Open `http://localhost:5173` in your browser.

---

*Made with ❤️ for TinkerHack.*
