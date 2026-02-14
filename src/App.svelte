<script>
  import { onDestroy } from "svelte";

  const API_BASE_URL = "http://localhost:3000";

  let step = "auth"; // 'auth', 'quiz', 'result', 'adopt', 'setup', 'session', 'analyzing'
  let currentQuestion = 0;
  let scores = { audio: 0, visual: 0, read: 0, practice: 0 };
  let learnerType = null; // { type: string, icon: string, description: string }

  // Auth State
  let email = "";
  let password = "";
  let username = "";
  let isSignUp = true;

  function handleAuth() {
    if (!email || !password || (isSignUp && !username)) {
      alert("Please fill in all fields");
      return;
    }
    // Simulate auth success
    step = "quiz";
  }

  // Setup State (user input for session)
  let notes = ""; // User's additional notes/comments
  let uploadedFiles = [];
  let fileInput;

  // Session State (generated content, pet, analytics)
  let generatedNotes = ""; // Dynamically generated learning content
  let petName = "";
  let petEmoji = "🐶";
  let petHealth = 100;
  let isSessionActive = false;
  let healthInterval;
  let distractionCount = 0; // New: counts tab switches/blurs

  const petOptions = [
    { id: "puppy", emoji: "🐶", label: "Puppy" },
    { id: "kitten", emoji: "🐱", label: "Kitten" },
    { id: "hamster", emoji: "🐹", label: "Hamster" },
  ];

  // Session Content Logic (for analyzing step)
  let searchQuery = "";
  let isAnalyzing = false;
  let scrapeProgress = 0;

  const quizQuestions = [
    {
      question: "When learning something new, you prefer:",
      options: [
        { text: "Listening to explanations", type: "audio" },
        { text: "Watching diagrams/videos", type: "visual" },
        { text: "Reading instructions or notes", type: "read" },
        { text: "Trying it yourself", type: "practice" },
      ],
    },
    {
      question: "In class, you understand best when the teacher:",
      options: [
        { text: "Explains verbally", type: "audio" },
        { text: "Uses charts, slides, drawings", type: "visual" },
        { text: "Gives written notes/textbook", type: "read" },
        { text: "Makes you do activities", type: "practice" },
      ],
    },
    {
      question: "When giving directions, you prefer:",
      options: [
        { text: "Someone telling you the route", type: "audio" },
        { text: "A map", type: "visual" },
        { text: "Written directions", type: "read" },
        { text: "Going once with someone", type: "practice" },
      ],
    },
    {
      question: "To remember information, you usually:",
      options: [
        { text: "Repeat it aloud", type: "audio" },
        { text: "Visualize it in your mind", type: "visual" },
        { text: "Write it down", type: "read" },
        { text: "Practice or act it out", type: "practice" },
      ],
    },
    {
      question: "Your favorite study method is:",
      options: [
        { text: "Listening to lectures/podcasts", type: "audio" },
        { text: "Watching tutorials/videos", type: "visual" },
        { text: "Reading books/notes", type: "read" },
        { text: "Solving problems/practicals", type: "practice" },
      ],
    },
    {
      question: "During exams, you recall information by:",
      options: [
        { text: "Remembering what you heard", type: "audio" },
        { text: "Seeing the page or diagram in your mind", type: "visual" },
        { text: "Remembering what you read", type: "read" },
        { text: "Remembering what you practiced", type: "practice" },
      ],
    },
    {
      question: "When assembling something new, you:",
      options: [
        { text: "Listen to someone explain", type: "audio" },
        { text: "Look at pictures/diagrams", type: "visual" },
        { text: "Read the manual carefully", type: "read" },
        { text: "Start building immediately", type: "practice" },
      ],
    },
    {
      question: "In group work, you prefer to:",
      options: [
        { text: "Discuss ideas", type: "audio" },
        { text: "Create visuals/presentations", type: "visual" },
        { text: "Take notes/write content", type: "read" },
        { text: "Handle practical tasks", type: "practice" },
      ],
    },
    {
      question: "You get bored most when learning involves:",
      options: [
        { text: "Too much reading", type: "audio" },
        { text: "No visuals", type: "visual" },
        { text: "Only listening", type: "read" },
        { text: "No hands-on work", type: "practice" },
      ],
    },
    {
      question: "Your ideal teacher would:",
      options: [
        { text: "Explain clearly through speech", type: "audio" },
        { text: "Use many visuals and examples", type: "visual" },
        { text: "Provide detailed notes", type: "read" },
        { text: "Give activities, experiments, tests", type: "practice" },
      ],
    },
  ];

  function handleAnswer(type) {
    scores[type]++;
    if (currentQuestion < quizQuestions.length - 1) {
      currentQuestion++;
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    // Determine winner
    const winner = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b,
    );

    // Map winner to pre-selected options and result display
    if (winner === "visual") {
      learnerType = {
        type: "visual", // Added for consistency and dynamic content generation
        label: "Visual Learner",
        icon: "👁️",
        description:
          "You learn best through images, diagrams, charts, and videos.",
      };
    } else if (winner === "audio") {
      learnerType = {
        type: "audio", // Added
        label: "Audio Learner",
        icon: "🎧",
        description:
          "You learn best by listening, discussing, and explaining ideas.",
      };
    } else if (winner === "read") {
      learnerType = {
        type: "read", // Added
        label: "Reader / Writer",
        icon: "📚",
        description:
          "You prefer reading texts, taking detailed notes, and writing summaries.",
      };
    } else {
      // practice
      learnerType = {
        type: "active", // Added
        label: "Active (Kinesthetic) Learner",
        icon: "🤸",
        description:
          "You learn best by doing, moving, building, and practicing.",
      };
    }

    step = "result";
    saveQuizResult(winner, learnerType);
  }

  async function saveQuizResult(winner, learnerType) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winner, learnerType }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Quiz saved");
    } catch (error) {
      console.error("Error saving quiz result:", error);
      alert("Failed to save quiz result. Please try again.");
    }
  }

  async function createSession() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/session/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          petName,
          petEmoji,
          learnerType,
          searchQuery,
          userNotes: notes, // user-provided notes
          generatedNotes, // dynamically generated notes
          uploadedFileNames: uploadedFiles.map((file) => file.name), // just send names for now
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Session created");
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    }
  }

  function proceedToAdopt() {
    step = "adopt";
  }

  async function adoptPet() {
    if (!petName || !petName.trim()) {
      alert("Please give your study buddy a name!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/pet/adopt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ petName, petEmoji }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Pet adopted");
      step = "setup";
    } catch (error) {
      console.error("Error adopting pet:", error);
      alert("Failed to adopt pet. Please try again.");
    }
  }

  function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    addFiles(files);
  }

  function handleDrop(event) {
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
  }

  function addFiles(files) {
    const validFiles = files.filter((file) => {
      // Basic validation for accepted types
      const validTypes = [
        ".ppt",
        ".pptx",
        ".pdf",
        ".txt",
        ".doc",
        ".docx",
        ".png",
        ".jpg",
        ".jpeg",
      ];
      return validTypes.some((type) => file.name.toLowerCase().endsWith(type));
    });
    uploadedFiles = [...uploadedFiles, ...validFiles];
  }

  function removeFile(fileToRemove) {
    uploadedFiles = uploadedFiles.filter((file) => file !== fileToRemove);
  }

  // --- Session lifecycle functions ---

  function startSession() {
    if (uploadedFiles.length === 0 && !searchQuery) { // Allow starting without files if there's a search query
      alert("Please upload files or enter a topic to start.");
      return;
    }

    // 1. Determine Topic from File if no explicit query
    if (searchQuery === "" && uploadedFiles.length > 0) {
      const fileName = uploadedFiles[0].name;
      searchQuery = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    } else if (searchQuery === "" && uploadedFiles.length === 0) {
        searchQuery = "General Study Session"; // Fallback if neither is provided
    }


    // 2. Start Analysis Simulation
    step = "analyzing";
    scrapeProgress = 0;

    const interval = setInterval(() => {
      scrapeProgress += 5;
      if (scrapeProgress >= 100) {
        clearInterval(interval);
        enterSession();
      }
    }, 100);
  }

  function enterSession() {
    step = "session";
    isSessionActive = true;
    distractionCount = 0; // Reset distraction count for new session
    generatedNotes = generateLearningContent(learnerType, searchQuery); // Generate learning content
    console.log("Notes generated"); // Log that notes have been generated
    createSession(); // Call API to create session

    // Start Pet Health Logic (healing while studying)
    healthInterval = setInterval(() => {
      if (!document.hidden && isSessionActive) {
        petHealth = Math.min(100, petHealth + 1);
      }
    }, 5000);

    // Add distraction listeners
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
    }
  }

  function handleVisibilityChange() {
    if (document.hidden && isSessionActive) {
      punishDistraction();
    }
  }

  function handleBlur() {
    if (isSessionActive) {
      punishDistraction();
    }
  }

  function punishDistraction() {
    distractionCount++;
    console.log("Distraction detected", distractionCount);

    petHealth = Math.max(0, petHealth - 35); // Reduce health significantly

    if (distractionCount >= 3) { // Pet "dies" after 3 distractions
      petHealth = 0;
    }

    if (petHealth === 0) {
      isSessionActive = false;
      clearInterval(healthInterval);
      // Optionally, show a "Game Over" screen or similar
    }
  }

  function generateLearningContent(learnerType, topic) {
    let content = "";
    // No need for lowerCaseTopic if we just use the original topic for display
    // const lowerCaseTopic = topic.toLowerCase();

    switch (learnerType.type) {
      case "visual":
        content = `
          <div class="card resource-card">
            <h3>Visual Summary: ${topic}</h3>
            <p>Here's a visual breakdown to help you grasp ${topic}:</p>
            <h4>Flow Diagram:</h4>
            <pre>
              Topic (${topic})
                ↓
              Subtopic 1: Key Idea A
                ↓
              Subtopic 2: Key Idea B
                ↓
              Application/Example
            </pre>
            <h4>Key Visual Anchors:</h4>
            <ul>
              <li>Remember the "Tree Analogy" for ${topic}'s structure.</li>
              <li>Visualize the "Gear Mechanism" for how its components interact.</li>
            </ul>
            <p>Imagine these concepts as interconnected images!</p>
          </div>
        `;
        break;
      case "audio":
        content = `
          <div class="card resource-card">
            <h3>Podcast Script: Understanding ${topic}</h3>
            <p>Imagine I’m explaining this to you:</p>
            <p>"Hey there, future expert! Let's chat about ${topic}. Think of it like this: If you were to tell a friend about ${topic}, you'd probably start with..."</p>
            <h4>Quick Recap:</h4>
            <ul>
              <li>Verbal overview of ${topic}</li>
              <li>Key terms pronounced and explained</li>
            </ul>
            <h4>Discussion Prompts:</h4>
            <ul>
              <li>How would you explain ${topic} in your own words?</li>
              <li>What questions do you have about ${topic}?</li>
            </ul>
            <p>Listen, repeat, and discuss!</p>
          </div>
        `;
        break;
      case "read":
        content = `
          <div class="card resource-card">
            <h3>Detailed Notes: ${topic}</h3>
            <h4>Definition:</h4>
            <p>${topic} refers to [insert formal definition here, e.g., 'a fundamental concept in X discipline, characterized by Y and Z'].</p>
            <h4>Core Principles:</h4>
            <ul>
              <li>Principle 1: [Elaborate on principle]</li>
              <li>Principle 2: [Elaborate on principle]</li>
              <li>Principle 3: [Elaborate on principle]</li>
            </ul>
            <h4>Detailed Notes:</h4>
            <p>Explore the nuances and intricate details of ${topic}. Understand its origins, evolution, and theoretical underpinnings. Pay attention to sub-sections like 'Historical Context,' 'Major Theories,' and 'Practical Implications.'</p>
            <h4>Summary:</h4>
            <p>In essence, ${topic} is about [concise summary].</p>
          </div>
        `;
        break;
      case "active":
        content = `
          <div class="card resource-card">
            <h3>Active Learning Challenges: ${topic}</h3>
            <h4>Mini Challenge:</h4>
            <p>Try to sketch the main components of ${topic} from memory. How do they connect?</p>
            <h4>Practice Task:</h4>
            <p>Given a scenario where [related problem], apply the principles of ${topic} to find a solution. Document your steps!</p>
          `;
          // Placeholder for real questions/tasks
          content += `
            <div class="quiz-card card">
              <h4>Quick Check: ${topic}</h4>
              <p>Test your knowledge with these generated questions.</p>
              <button class="cta-btn" style="margin-top: 1rem; font-size: 1rem;"
                >Start Practice Quiz</button>
            </div>
            <div class="card" style="margin-top: 1rem;">
              <h4>Hands-on Task</h4>
              <p>
                Try to implement or build a model regarding ${topic} using the
                provided diagram (diagram not shown, placeholder).
              </p>
            </div>
          `;
          content += `
            <h4>Apply It Yourself:</h4>
            <p>Think of a real-world example where ${topic} is demonstrated. Can you explain it?</p>
            <h4>Quick Self-Test:</h4>
            <ul>
              <li>What is the primary function of ${topic}?</li>
              <li>Describe a situation where ${topic} would be crucial.</li>
            </ul>
            <p>Learn by doing, experimenting, and applying!</p>
          </div>
        `;
        break;
      default:
        content = `<div class="card resource-card"><h3>General Study Guide: ${topic}</h3><p>A comprehensive overview for your study session on ${topic}.</p></div>`;
    }
    return content;
  }

  onDestroy(() => {
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      clearInterval(healthInterval);
    }
  });
</script>

<main
  class="container"
  class:setup-mode={step === "setup" || step === "session"}
>
  {#if step === "auth"}
    <div class="auth-container">
      <header class="hero">
        <h1 class="title">Focus Pet</h1>
        <p class="subtitle">Focus responsibly. Save your pet.</p>
      </header>

      <div class="card auth-card">
        <h2 class="auth-title">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>

        <form class="auth-form" on:submit|preventDefault={handleAuth}>
          {#if isSignUp}
            <div class="field-group">
              <label for="username">Full Name</label>
              <input
                type="text"
                id="username"
                bind:value={username}
                required
                placeholder="John Doe"
                class="text-input"
              />
            </div>
          {/if}

          <div class="field-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              bind:value={email}
              required
              placeholder="you@example.com"
              class="text-input"
            />
          </div>

          <div class="field-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              bind:value={password}
              required
              placeholder="••••••••"
              class="text-input"
            />
          </div>

          <button type="submit" class="cta-btn">
            {isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p class="auth-switch">
          {isSignUp ? "Already have an account?" : "Need an account?"}
          <button class="link-btn" on:click={() => (isSignUp = !isSignUp)}>
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>

      <div class="auth-preview">
        <span style="font-size: 3rem;">🐶</span>
        <p style="color: #64748b; font-size: 0.9rem;">
          Join to adopt your study companion!
        </p>
      </div>
    </div>
  {:else if step === "quiz"}
    <div class="quiz-container">
      <header class="hero">
        <h1 class="title">Discover Your Learning Style</h1>
        <p class="subtitle">
          Question {currentQuestion + 1} of {quizQuestions.length}
        </p>
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: {(currentQuestion / quizQuestions.length) * 100}%"
          ></div>
        </div>
      </header>

      <div class="card quiz-card">
        <h2 class="question-text">{quizQuestions[currentQuestion].question}</h2>

        <div class="options-list">
          {#each quizQuestions[currentQuestion].options as option}
            <button
              class="quiz-option"
              on:click={() => handleAnswer(option.type)}
            >
              {option.text}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {:else if step === "result"}
    <div class="quiz-container">
      <header class="hero">
        <h1 class="title">Your Learning Profile</h1>
        <p class="subtitle">
          Based on your answers, we've identified your style.
        </p>
      </header>

      <div class="card result-card">
        <div class="result-icon">{learnerType.icon}</div>
        <h2 class="result-title">{learnerType.label}</h2>
        <p class="result-description">{learnerType.description}</p>

        <button class="cta-btn" on:click={proceedToAdopt}>
          Find Your Companion
        </button>
      </div>
    </div>
  {:else if step === "adopt"}
    <div class="quiz-container">
      <header class="hero">
        <h1 class="title">Adopt Your AI Study Buddy</h1>
        <p class="subtitle">A loyal companion to keep you focused.</p>
      </header>

      <div class="card adopt-card">
        <div class="pet-container">
          <div class="pet-avatar" role="img" aria-label="Virtual Pet">
            {petEmoji}
          </div>
          <div class="pet-shadow"></div>
        </div>

        <div class="pet-selection">
          {#each petOptions as pet}
            <button
              class="pet-option-btn"
              class:selected={petEmoji === pet.emoji}
              on:click={() => (petEmoji = pet.emoji)}
              aria-label="Choose {pet.label}"
              title="Select {pet.label}"
            >
              {pet.emoji}
            </button>
          {/each}
        </div>

        <div class="field-group" style="text-align: center;">
          <label for="pet-name" style="text-align: center;"
            >Name your companion:</label
          >
          <input
            type="text"
            id="pet-name"
            bind:value={petName}
            placeholder="e.g. Sparky, Brainy, Rex"
            class="text-input pet-input"
            on:keydown={(e) => e.key === "Enter" && adoptPet()}
          />
        </div>

        <button class="cta-btn bounce-btn" on:click={adoptPet}>
          Adopt & Start Journey
        </button>
      </div>
    </div>
  {:else if step === "setup"}
    <div class="setup-grid">
      <!-- Pet Sidebar -->
      <aside class="pet-sidebar">
        <div class="pet-mascot" role="img" aria-label="Your Study Buddy">
          {petEmoji}
        </div>

        <!-- Health Bar -->
        <div class="health-container">
          <div class="health-label">Health: {petHealth}%</div>
          <div class="health-bar-bg">
            <div
              class="health-bar-fill"
              style="width: {petHealth}%; background: {petHealth > 50
                ? '#10b981'
                : petHealth > 20
                  ? '#f59e0b'
                  : '#ef4444'};"
            ></div>
          </div>
        </div>

        <div class="pet-bubble">
          {#if petHealth > 80}
            Let's crush this study session, {petName || "Friend"}! 🚀
          {:else if petHealth > 40}
            I'm feeling a bit neglected... Stay focused! 🥺
          {:else if petHealth > 0}
            Help! I'm fading! CLOSE THOSE TABS! 🚑
          {:else}
            *Fainted* ... (Refresh to restart) 💀
          {/if}
        </div>

        <div class="pet-info-trigger">
          <span class="info-label">ℹ️ How {petName || "I"} Work</span>
          <div class="pet-info-card">
            <p>
              Hi! I'm <strong>{petName || "Coco"}</strong>, your focus
              companion.
            </p>
            <p>My health is linked to your attention:</p>
            <ul>
              <li>✨ <strong>Stay Focused:</strong> I gain HP</li>
              <li>⚠️ <strong>Switch Tabs:</strong> I take damage</li>
            </ul>
            <p>Keep me alive by studying!</p>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="setup-content">
        <!-- Hero Section -->
        <header class="hero" style="text-align: left; align-items: flex-start;">
          <h1 class="title">Focus Pet</h1>
          <p class="subtitle">
            Your autonomous learning coach that adapts to how you learn best.
          </p>
        </header>

        <!-- Main Input Card -->
        <div class="card">
          <!-- Upload Section -->
          <div class="field-group">
            <label for="file-upload">Upload Study Materials (Optional)</label>
            <div
              class="upload-area"
              on:dragover|preventDefault={(e) => {}}
              on:drop|preventDefault={handleDrop}
              on:click={() => fileInput.click()}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === "Enter" && fileInput.click()}
            >
              <input
                type="file"
                id="file-upload"
                bind:this={fileInput}
                on:change={handleFileSelect}
                accept=".ppt,.pptx,.pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                hidden
              />
              {#if uploadedFiles.length === 0}
                <div class="upload-placeholder">
                  <span class="upload-icon">📂</span>
                  <p><strong>Click to upload</strong> or drag and drop</p>
                  <span class="file-types">PPT, PDF, Images, Text</span>
                </div>
              {:else}
                <div class="file-list">
                  {#each uploadedFiles as file}
                    <div class="file-item">
                      <span class="file-icon">📄</span>
                      <span class="file-name">{file.name}</span>
                      <button
                        type="button"
                        class="remove-btn"
                        on:click|stopPropagation={() => removeFile(file)}
                        aria-label="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  {/each}
                  <div class="add-more">
                    <span>+ Add more files</span>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Notes/Comment Section -->
          <div class="field-group">
            <label for="notes">Additional Notes / Comments (Optional)</label>
            <textarea
              id="notes"
              bind:value={notes}
              placeholder="Any specific instructions or context for your study session..."
              class="text-input textarea"
              rows="3"
            ></textarea>
          </div>

          <!-- CTA -->
          <button class="cta-btn" on:click={startSession}>
            Start Study Session
          </button>
        </div>
      </div>
    </div>
  {:else if step === "analyzing"}
    <div class="card" style="text-align: center; max-width: 500px;">
      <div class="analyzing-icon">🔍</div>
      <h2 class="title" style="font-size: 2rem;">Analyzing Content</h2>
      <p class="subtitle">Scraping web resources for "{searchQuery}"...</p>

      <div class="progress-bar" style="margin-top: 2rem;">
        <div class="progress-fill" style="width: {scrapeProgress}%"></div>
      </div>
      <p style="margin-top: 1rem; color: #64748b; font-size: 0.9rem;">
        {scrapeProgress < 30
          ? "Extracting keywords..."
          : scrapeProgress < 70
            ? "Finding videos & articles..."
            : "Generating study plan..."}
      </p>
    </div>
  {:else if step === "session"}
    <div class="setup-grid">
      <!-- Pet Sidebar -->
      <aside class="pet-sidebar">
        <div class="pet-mascot" role="img" aria-label="Your Study Buddy">
          {petEmoji}
        </div>

        <!-- Health Bar -->
        <div class="health-container">
          <div class="health-label">Health: {petHealth}%</div>
          <div class="health-bar-bg">
            <div
              class="health-bar-fill"
              style="width: {petHealth}%; background: {petHealth > 50
                ? '#10b981'
                : petHealth > 20
                  ? '#f59e0b'
                  : '#ef4444'};"
            ></div>
          </div>
        </div>

        <div class="pet-bubble">
          {#if petHealth > 80}
            Keep going! I'm learning with you! 📚
          {:else if petHealth > 40}
            Don't get distracted now... focus! 🧐
          {:else if petHealth > 0}
            I'm feeling dizzy... too many tabs... 💫
          {:else}
            *Fainted* ... (Refresh to restart) 💀
          {/if}
        </div>
      </aside>

      <!-- Main Dashboard -->
      <div class="setup-content">
        <header class="dashboard-header">
          <div class="header-info">
            <span class="badge">{learnerType.label}</span>
            <h1 class="session-title">{searchQuery}</h1>
          </div>
          <div class="timer-badge">Session Active ⚡</div>
        </header>

        <!-- Dynamic Resource Content -->
        <div class="resource-section">
          <h3 class="section-title">Your Personalized Learning Material</h3>
          {@html generatedNotes}
        </div>

      </div>
    </div>
  {/if}

  <!-- Footer -->
  <footer class="footer">
    <p>AI Study Commander • TinkerHack 2026</p>
  </footer>
</main>

<style>
  /* Layout & Spacing */
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
    font-family: "Inter", sans-serif;
  }

  /* Hero Typography */
  .hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .title {
    font-size: 3rem;
    color: #1e293b; /* Slate 800 */
    letter-spacing: -0.02em;
    margin-bottom: 0.25rem;
    text-shadow: 0 2px 0 rgba(255, 255, 255, 0.5);
  }

  .subtitle {
    font-size: 1.25rem;
    font-weight: 500;
    color: #64748b; /* Slate 500 */
    margin: 0;
  }

  /* Card Component - Glassmorphism */
  .card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    width: 100%;
    max-width: 600px;
    padding: 2.5rem;
    border-radius: 1.5rem;
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: #334155;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: left;
    border: none;
    padding: 0;
    margin: 0;
  }

  label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #475569; /* Slate 600 */
    margin-left: 0.25rem;
    padding: 0;
  }

  /* Field: Topic Text input */
  .text-input {
    width: 100%;
    padding: 1rem 1.25rem;
    font-size: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 1rem;
    outline: none;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.5);
    color: #1e293b;
    box-sizing: border-box; /* Crucial for full width */
    font-family: inherit; /* Ensure textarea inherits font */
  }

  .text-input::placeholder {
    color: #94a3b8;
  }

  .text-input.textarea {
    resize: vertical;
    min-height: 80px;
  }

  .text-input:focus {
    border-color: #ec4899; /* Pink 500 */
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.1);
  }

  /* Field: Duration Pill Buttons */
  .button-group {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .pill-btn {
    padding: 0.6rem 1.25rem;
    border-radius: 2rem;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .pill-btn:hover {
    background: #f1f5f9;
    color: #334155;
    transform: translateY(-1px);
  }

  .pill-btn.selected {
    background: #eef2ff;
    color: #4f46e5;
    border-color: #4f46e5;
    font-weight: 600;
    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1);
  }

  /* Field: Discipline Slider Group */
  .slider-group {
    display: flex;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 0.75rem;
    gap: 0;
  }

  .scale-btn {
    flex: 1;
    padding: 0.6rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .mode-icon {
    font-size: 1.25rem;
  }

  .mode-label {
    font-size: 0.85rem;
  }

  .scale-btn:hover {
    color: #334155;
  }

  .scale-btn.selected {
    background: white;
    color: #0f172a;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  /* Specific colors for strict modes when selected */
  .scale-btn.ruthless.selected {
    color: #dc2626; /* Red-600 */
  }

  /* Field: File Upload */
  .upload-area {
    border: 2px dashed rgba(71, 85, 105, 0.4); /* Slate 600 */
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.5);
  }

  .upload-area:hover {
    border-color: #ec4899; /* Pink 500 */
    background: rgba(255, 255, 255, 0.8);
  }

  .upload-area:focus {
    outline: none;
    border-color: #ec4899;
    box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.1);
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #475569; /* Slate 600 */
  }

  .upload-icon {
    font-size: 2rem;
  }

  .file-types {
    font-size: 0.8rem;
    color: #64748b;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    text-align: left;
  }

  .file-name {
    flex: 1;
    font-size: 0.9rem;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .remove-btn:hover {
    background: #f1f5f9;
    color: #ef4444; /* Red 500 */
  }

  .add-more {
    font-size: 0.85rem;
    color: #06b6d4; /* Cyan 500 */
    font-weight: 500;
    margin-top: 0.5rem;
  }

  /* CTA Button */
  .cta-btn {
    margin-top: 1rem;
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #ec4899 0%, #f59e0b 100%);
    border: none;
    border-radius: 1rem;
    box-shadow: 0 10px 20px -5px rgba(236, 72, 153, 0.4);
    transition: all 0.3s ease;
  }

  .cta-btn:hover {
    box-shadow: 0 15px 25px -5px rgba(236, 72, 153, 0.5);
    transform: translateY(-2px) scale(1.01);
    filter: brightness(1.1);
  }

  .cta-btn:active {
    transform: translateY(0) scale(0.99);
  }

  /* ... (keeping intermediate styles if any) ... */

  /* Auth Page Styles */
  .auth-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    width: 100%;
    max-width: 400px;
  }

  .auth-card {
    padding: 2rem;
  }

  .auth-title {
    text-align: center;
    font-size: 1.5rem;
    color: #1e293b; /* Slate 800 */
    margin-bottom: 1.5rem;
  }

  .auth-switch {
    text-align: center;
    font-size: 0.9rem;
    margin-top: 1.5rem;
    color: #475569; /* Slate 600 */
  }

  .link-btn {
    background: none;
    border: none;
    color: #ec4899; /* Pink 500 */
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    font-size: inherit;
  }

  .link-btn:hover {
    color: #be185d; /* Pink 700 */
  }

  .auth-preview {
    text-align: center;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0px);
    }
  }
</style>
