<script>
  import { onDestroy } from "svelte";

  let step = "auth"; // 'auth', 'quiz', 'result', 'adopt', 'setup', 'session'
  let currentQuestion = 0;
  let scores = { audio: 0, visual: 0, read: 0, practice: 0 };
  let learnerType = null; // { label: string, icon: string, description: string }

  // Auth State
  let email = "";
  let password = "";
  let isSignUp = true;

  function handleAuth() {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    // Simulate auth success
    step = "quiz";
  }

  let notes = "";
  let duration = "1 hour";
  let learningStyles = [];
  let showLearningOptions = false;
  let uploadedFiles = [];
  let fileInput;

  let petName = "";
  let petEmoji = "🐶";
  let petHealth = 100;
  let isSessionActive = false;
  let healthInterval;

  // Session Content Logic
  let searchQuery = "";
  let isAnalyzing = false;
  let scrapeProgress = 0;

  // ... (rest of logic will be handled by existing functions or new ones below)

  function startSession() {
    if (uploadedFiles.length === 0) {
      alert("Please upload files to start.");
      return;
    }

    // 1. Determine Topic from File
    if (uploadedFiles.length > 0) {
      const fileName = uploadedFiles[0].name;
      searchQuery = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    } else {
      searchQuery = "Study Session";
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

    // Start Pet Health Logic
    healthInterval = setInterval(() => {
      if (!document.hidden && isSessionActive) {
        // Healing while studying
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
    petHealth = Math.max(0, petHealth - 10);

    if (petHealth === 0) {
      isSessionActive = false;
      clearInterval(healthInterval);
    }
  }

  onDestroy(() => {
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      clearInterval(healthInterval);
    }
  });

  const petOptions = [
    { id: "puppy", emoji: "🐶", label: "Puppy" },
    { id: "kitten", emoji: "🐱", label: "Kitten" },
    { id: "hamster", emoji: "🐹", label: "Hamster" },
  ];

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
      learningStyles = ["visual", "video"];
      learnerType = {
        label: "Visual Learner",
        icon: "👁️",
        description:
          "You learn best through images, diagrams, charts, and videos.",
      };
    } else if (winner === "audio") {
      learningStyles = ["audio"];
      learnerType = {
        label: "Audio Learner",
        icon: "🎧",
        description:
          "You learn best by listening, discussing, and explaining ideas.",
      };
    } else if (winner === "read") {
      learningStyles = ["read"];
      learnerType = {
        label: "Reader / Writer",
        icon: "📚",
        description:
          "You prefer reading texts, taking detailed notes, and writing summaries.",
      };
    } else {
      // practice
      learningStyles = ["practice"];
      learnerType = {
        label: "Active (Kinesthetic) Learner",
        icon: "🤸",
        description:
          "You learn best by doing, moving, building, and practicing.",
      };
    }

    step = "result";
  }

  function proceedToAdopt() {
    step = "adopt";
  }

  function adoptPet() {
    if (!petName || !petName.trim()) {
      alert("Please give your study buddy a name!");
      return;
    }
    step = "setup";
  }

  const durationOptions = ["30 min", "1 hour", "2 hours", "Custom"];
  const fragilityOptions = [
    { label: "Resilient", icon: "🛡️", desc: "Harder to lose health" },
    { label: "Normal", icon: "❤️", desc: "Standard health loss" },
    { label: "Sensitive", icon: "💔", desc: "Needs extra care & focus" },
  ];

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
</script>

<main
  class="container"
  class:setup-mode={step === "setup" || step === "session"}
>
  {#if step === "auth"}
    <div class="auth-container">
      <header class="hero">
        <h1 class="title">AI Study Commander</h1>
        <p class="subtitle">Focus responsibly. Save your pet.</p>
      </header>

      <div class="card auth-card">
        <h2 class="auth-title">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>

        <form class="auth-form" on:submit|preventDefault={handleAuth}>
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
        <div class="result-icon">{learnerType?.icon}</div>
        <h2 class="result-title">{learnerType?.label}</h2>
        <p class="result-description">{learnerType?.description}</p>

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
          <h1 class="title">AI Study Commander</h1>
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
            <span class="badge">{learnerType?.label || "General Learner"}</span>
            <h1 class="session-title">{searchQuery}</h1>
          </div>
          <div class="timer-badge">Session Active ⚡</div>
        </header>

        <!-- Dynamic Resource Content -->

        {#if learnerType?.label === "Visual Learner" || learnerType?.label === "Audio Learner"}
          <!-- Video / Audio Feed -->
          <div class="resource-section">
            <h3 class="section-title">
              {learnerType?.label === "Visual Learner"
                ? "📺 Curated Videos"
                : "🎧 Podcasts & Lectures"}
            </h3>
            <div class="video-grid">
              <!-- Mock Videos -->
              <div class="video-card">
                <div class="video-thumbnail">▶</div>
                <div class="video-info">
                  <h4>Introduction to {searchQuery}</h4>
                  <p>10:24 • CrashCourse</p>
                </div>
              </div>
              <div class="video-card">
                <div class="video-thumbnail">▶</div>
                <div class="video-info">
                  <h4>Advanced Concepts in {searchQuery}</h4>
                  <p>15:30 • Khan Academy (Simulated)</p>
                </div>
              </div>
              <div class="video-card">
                <div class="video-thumbnail">▶</div>
                <div class="video-info">
                  <h4>{searchQuery} Explained Simply</h4>
                  <p>08:45 • TED-Ed</p>
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if learnerType?.label === "Reader / Writer" || !learnerType}
          <!-- Text Content -->
          <div class="resource-section">
            <h3 class="section-title">📚 Smart Summary & Notes</h3>
            <div class="text-content card">
              <p>
                <strong>Overview:</strong>
                {searchQuery} is a fundamental concept in this field. It involves
                understanding the core principles and applying them to solve complex
                problems.
              </p>
              <ul>
                <li>Key Concept 1: The foundation of {searchQuery}.</li>
                <li>Key Concept 2: Practical applications and case studies.</li>
                <li>Key Concept 3: Future trends and developments.</li>
              </ul>
              <p>
                <em
                  >(Content generated from uploaded materials and web sources)</em
                >
              </p>
            </div>
          </div>
        {/if}

        {#if learnerType?.label === "Active (Kinesthetic) Learner"}
          <!-- Practice Content -->
          <div class="resource-section">
            <h3 class="section-title">🧪 Practical Exercises</h3>
            <div class="quiz-card card">
              <h4>Quick Check: {searchQuery}</h4>
              <p>Test your knowledge with these generated questions.</p>
              <button class="cta-btn" style="margin-top: 1rem; font-size: 1rem;"
                >Start Practice Quiz</button
              >
            </div>

            <div class="card" style="margin-top: 1rem;">
              <h4>Hands-on Task</h4>
              <p>
                Try to implement or build a model regarding {searchQuery} using the
                provided diagram.
              </p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <footer class="footer">
    <p>No signup required • Start instantly</p>
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
    background: linear-gradient(to right, #4f46e5, #9333ea);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
    margin-bottom: 0.25rem;
  }

  .subtitle {
    font-size: 1.25rem;
    font-weight: 500;
    color: #334155;
    margin: 0;
  }

  /* Card Component */
  .card {
    background: white;
    width: 100%;
    max-width: 600px;
    padding: 2.5rem;
    border-radius: 1.5rem;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 2rem;
    border: 1px solid #f1f5f9;
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
    color: #475569;
    margin-left: 0.25rem;
    padding: 0;
  }

  /* Field: Topic Text input */
  .text-input {
    width: 100%;
    padding: 1rem 1.25rem;
    font-size: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 1rem;
    outline: none;
    transition: all 0.2s;
    background: #f8fafc;
    box-sizing: border-box; /* Crucial for full width */
    font-family: inherit; /* Ensure textarea inherits font */
  }

  .text-input.textarea {
    resize: vertical;
    min-height: 80px;
  }

  .text-input:focus {
    border-color: #6366f1;
    background: white;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
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
    border: 2px dashed #cbd5e1;
    border-radius: 1rem;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #f8fafc;
  }

  .upload-area:hover {
    border-color: #6366f1;
    background: #f1f5f9;
  }

  .upload-area:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
  }

  .upload-icon {
    font-size: 2rem;
  }

  .file-types {
    font-size: 0.8rem;
    color: #94a3b8;
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
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    text-align: left;
  }

  .file-name {
    flex: 1;
    font-size: 0.9rem;
    color: #334155;
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
    color: #ef4444;
  }

  .add-more {
    font-size: 0.85rem;
    color: #6366f1;
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
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border: none;
    border-radius: 1rem;
    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
    transition: all 0.3s ease;
  }

  .cta-btn:hover {
    box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.4);
    transform: translateY(-2px) scale(1.01);
    filter: brightness(1.1);
  }

  .cta-btn:active {
    transform: translateY(0) scale(0.99);
  }

  /* Footer */
  .footer {
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .title {
      font-size: 2.25rem;
    }

    .card {
      padding: 1.5rem;
      border-radius: 1rem;
    }

    .slider-group {
      flex-wrap: wrap;
    }

    .scale-btn {
      flex-basis: 45%;
    }
  }

  /* Quiz Styles */
  .quiz-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .quiz-card {
    text-align: center;
    align-items: center;
  }

  .question-text {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 2rem;
    line-height: 1.3;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
  /* Result Styles */
  .result-card {
    text-align: center;
    align-items: center;
    gap: 1.5rem;
  }

  .result-icon {
    font-size: 5rem;
    margin-bottom: 1rem;
    animation: float 3s ease-in-out infinite;
  }

  .result-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(to right, #4f46e5, #9333ea);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .result-description {
    font-size: 1.1rem;
    color: #64748b;
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.6;
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

  .quiz-option {
    padding: 1.25rem;
    font-size: 1.1rem;
    color: #334155;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .quiz-option:hover {
    border-color: #6366f1;
    background: #eef2ff;
    color: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .progress-bar {
    width: 200px;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    margin: 1rem auto 0;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #4f46e5;
    transition: width 0.3s ease;
  }
  /* Pet Adoption Styles */
  .adopt-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    text-align: center;
  }
  .pet-selection {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .pet-option-btn {
    font-size: 2rem;
    padding: 0.5rem;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    background: #f1f5f9;
    transition: all 0.2s ease;
  }

  .pet-option-btn:hover {
    transform: scale(1.1);
    background: #e2e8f0;
  }

  .pet-option-btn.selected {
    border-color: #6366f1;
    background: #eef2ff;
    transform: scale(1.15);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .pet-container {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .pet-avatar {
    font-size: 8rem;
    animation: float 3s ease-in-out infinite;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 2;
  }

  .pet-avatar:hover {
    transform: scale(1.1) rotate(5deg);
    filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4));
  }

  .pet-shadow {
    position: absolute;
    bottom: 20px;
    width: 80px;
    height: 10px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    animation: shadow 3s ease-in-out infinite;
    z-index: 1;
  }

  .pet-input {
    text-align: center;
    font-size: 1.25rem;
    max-width: 300px;
  }

  .bounce-btn:hover {
    animation: bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes shadow {
    0% {
      transform: scale(1);
      opacity: 0.1;
    }
    50% {
      transform: scale(0.8);
      opacity: 0.2;
    }
    100% {
      transform: scale(1);
      opacity: 0.1;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  /* Setup Mode Layout */
  .container.setup-mode {
    max-width: 1200px;
    align-items: flex-start;
  }

  .setup-grid {
    display: flex;
    gap: 3rem;
    width: 100%;
    align-items: flex-start;
    justify-content: center;
    position: relative;
  }

  .pet-sidebar {
    width: 250px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: sticky;
    top: 2rem;
    padding-top: 2rem;
    flex-shrink: 0;
  }

  .pet-mascot {
    font-size: 8rem;
    animation: float 4s ease-in-out infinite;
    cursor: grab;
    transition: transform 0.2s;
    filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));
  }

  .pet-mascot:hover {
    transform: scale(1.1) rotate(5deg);
  }

  .pet-bubble {
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    border-bottom-left-radius: 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-top: 1rem;
    font-weight: 600;
    color: #4f46e5;
    position: relative;
    text-align: center;
    border: 1px solid #e2e8f0;
    opacity: 0;
    animation: fadeIn 0.5s ease 0.5s forwards;
  }

  .pet-bubble::after {
    content: "";
    position: absolute;
    top: -10px;
    left: 20px;
    border-width: 0 10px 10px;
    border-style: solid;
    border-color: transparent transparent white;
  }

  .setup-content {
    flex: 1;
    max-width: 700px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 900px) {
    .setup-grid {
      flex-direction: column;
      align-items: center;
    }

    .pet-sidebar {
      position: relative;
      width: 100%;
      flex-direction: row;
      justify-content: center;
      gap: 1rem;
      top: 0;
      padding-top: 0;
      margin-bottom: 1rem;
    }

    .pet-mascot {
      font-size: 4rem;
    }

    .pet-bubble {
      margin-top: 0;
      font-size: 0.9rem;
    }

    .pet-bubble::after {
      top: 50%;
      left: -10px;
      margin-top: -10px;
      border-width: 10px 10px 10px 0;
      border-color: transparent white transparent transparent;
    }
  }
  .health-container {
    width: 60%;
    margin-top: -1rem;
    margin-bottom: 1rem;
    position: relative;
    z-index: 5;
  }

  .health-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.25rem;
  }

  .health-bar-bg {
    width: 100%;
    height: 10px;
    background: #e2e8f0;
    border-radius: 5px;
    overflow: hidden;
  }

  .health-bar-fill {
    height: 100%;
    transition:
      width 0.5s ease,
      background 0.3s;
  }
  .helper-text {
    font-size: 0.85rem;
    color: #64748b;
    text-align: center;
    margin-top: 0.5rem;
    font-style: italic;
  }
  /* Analyzing Step */
  .analyzing-icon {
    font-size: 4rem;
    animation: pulse 1.5s infinite;
    margin-bottom: 1rem;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Session Dashboard */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
  }

  .badge {
    display: inline-block;
    background: #eef2ff;
    color: #4f46e5;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    width: fit-content;
  }

  .timer-badge {
    background: #ecfdf5;
    color: #059669;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
    animation: pulse 3s infinite;
  }

  .session-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    text-transform: capitalize;
  }

  .resource-section {
    margin-bottom: 3rem;
  }

  .section-title {
    font-size: 1.25rem;
    color: #334155;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .video-card {
    background: white;
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    transition: transform 0.2s;
    cursor: pointer;
  }

  .video-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .video-thumbnail {
    height: 120px;
    background: #1e293b;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .video-info {
    padding: 1rem;
  }

  .video-info h4 {
    font-size: 0.95rem;
    margin: 0 0 0.5rem 0;
    color: #0f172a;
  }

  .video-info p {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0;
  }

  .text-content ul {
    padding-left: 1.5rem;
    color: #475569;
  }

  .text-content li {
    margin-bottom: 0.5rem;
  }

  /* Pet Info Tooltip */
  .pet-info-trigger {
    margin-top: 1.5rem;
    position: relative;
    cursor: pointer;
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 500;
  }

  .pet-info-trigger::after {
    content: ""; /* Underline effect */
    display: block;
    width: 0;
    height: 1px;
    background: #64748b;
    transition: width 0.3s;
  }

  .pet-info-trigger:hover::after {
    width: 100%;
  }

  .pet-info-card {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    width: 220px;
    background: white;
    padding: 1rem;
    border-radius: 0.75rem;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 10;
    font-size: 0.85rem;
    text-align: left;
    color: #334155;
  }

  .pet-info-card::before {
    content: "";
    position: absolute;
    top: -6px;
    left: 50%;
    margin-left: -6px;
    border-width: 0 6px 6px;
    border-style: solid;
    border-color: transparent transparent #e2e8f0;
  }

  .pet-info-trigger:hover .pet-info-card {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }

  .pet-info-card ul {
    padding-left: 1.25rem;
    margin: 0.5rem 0;
  }

  .pet-info-card li {
    margin-bottom: 0.25rem;
  }

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
    color: #1e293b;
    margin-bottom: 1.5rem;
  }

  .auth-switch {
    text-align: center;
    font-size: 0.9rem;
    margin-top: 1.5rem;
    color: #64748b;
  }

  .link-btn {
    background: none;
    border: none;
    color: #4f46e5;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    font-size: inherit;
  }

  .link-btn:hover {
    color: #4338ca;
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
