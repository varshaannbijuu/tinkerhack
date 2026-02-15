<script>

  import { onDestroy } from "svelte";

  const API_BASE_URL = "https://tinkerhack-pw8b.onrender.com";

  let step = "auth";
  let currentQuestion = 0;
  let scores = { audio: 0, visual: 0, read: 0, active: 0 };
  let learnerType = null;
  let user = null;
  let isLoading = false;
  let error = null;

  // Auth
  let email = "";
  let password = "";
  let username = "";
  let isSignUp = true;

  async function handleAuth() {
    error = null;
    if (!email || !password || (isSignUp && !username)) {
      error = "Please fill in all fields";
      return;
    }

    isLoading = true;
    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const body = isSignUp
        ? { username, email, password }
        : { email, password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || "Authentication failed");
      }

      user = data;
      localStorage.setItem("user", JSON.stringify(user));

      currentQuestion = 0;
      scores = { audio: 0, visual: 0, read: 0, active: 0 };
      step = "quiz";
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  // Setup
  let notes = "";
  let uploadedFiles = [];
  let fileInput;

  // Session
  let generatedContent = null;
  let petName = "";
  let petEmoji = "🐶";
  let petHealth = 100;
  let isSessionActive = false;
  let petDies = false;
  let healthInterval;
  let focusTimer;
  let distractionCount = 0;

  let searchQuery = "";
  let scrapeProgress = 0;

  const quizQuestions = [
    {
      question: "When learning something new, you prefer:",
      options: [
        { text: "Listening to explanations", type: "audio" },
        { text: "Watching diagrams/videos", type: "visual" },
        { text: "Reading instructions or notes", type: "read" },
        { text: "Trying it yourself", type: "active" },
      ],
    },
    {
      question: "In class, you understand best when the teacher:",
      options: [
        { text: "Explains verbally", type: "audio" },
        { text: "Uses charts, slides, drawings", type: "visual" },
        { text: "Gives written notes/textbook", type: "read" },
        { text: "Makes you do activities", type: "active" },
      ],
    },
    {
      question: "When giving directions, you prefer:",
      options: [
        { text: "Someone telling you the route", type: "audio" },
        { text: "A map", type: "visual" },
        { text: "Written directions", type: "read" },
        { text: "Going once with someone", type: "active" },
      ],
    },
    {
      question: "To remember information, you usually:",
      options: [
        { text: "Repeat it aloud", type: "audio" },
        { text: "Visualize it in your mind", type: "visual" },
        { text: "Write it down", type: "read" },
        { text: "Practice or act it out", type: "active" },
      ],
    },
    {
      question: "Your favorite study method is:",
      options: [
        { text: "Listening to lectures/podcasts", type: "audio" },
        { text: "Watching tutorials/videos", type: "visual" },
        { text: "Reading books/notes", type: "read" },
        { text: "Solving problems/practicals", type: "active" },
      ],
    },
    {
      question: "During exams, you recall information by:",
      options: [
        { text: "Remembering what you heard", type: "audio" },
        { text: "Seeing the page or diagram in your mind", type: "visual" },
        { text: "Remembering what you read", type: "read" },
        { text: "Remembering what you practiced", type: "active" },
      ],
    },
    {
      question: "When assembling something new, you:",
      options: [
        { text: "Listen to someone explain", type: "audio" },
        { text: "Look at pictures/diagrams", type: "visual" },
        { text: "Read the manual carefully", type: "read" },
        { text: "Start building immediately", type: "active" },
      ],
    },
    {
      question: "In group work, you prefer to:",
      options: [
        { text: "Discuss ideas", type: "audio" },
        { text: "Create visuals/presentations", type: "visual" },
        { text: "Take notes/write content", type: "read" },
        { text: "Handle practical tasks", type: "active" },
      ],
    },
    {
      question: "You get bored most when learning involves:",
      options: [
        { text: "Too much reading", type: "audio" },
        { text: "No visuals", type: "visual" },
        { text: "Only listening", type: "read" },
        { text: "No hands-on work", type: "active" },
      ],
    },
    {
      question: "Your ideal teacher would:",
      options: [
        { text: "Explain clearly through speech", type: "audio" },
        { text: "Use many visuals and examples", type: "visual" },
        { text: "Provide detailed notes", type: "read" },
        { text: "Give activities, experiments, tests", type: "active" },
      ],
    },
  ];

  const petOptions = [
    { emoji: "🐶", label: "Puppy" },
    { emoji: "🐱", label: "Kitten" },
    { emoji: "🐹", label: "Hamster" },
  ];

  // ---------------- QUIZ ----------------

  function handleAnswer(type) {
    scores[type]++;
    if (currentQuestion < quizQuestions.length - 1) {
      currentQuestion++;
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    const winner = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b,
    );

    const map = {
      visual: {
        type: "visual",
        label: "Visual Learner",
        icon: "👁️",
        description: "You learn best with diagrams and visuals.",
      },
      audio: {
        type: "audio",
        label: "Audio Learner",
        icon: "🎧",
        description: "You learn best by listening.",
      },
      read: {
        type: "read",
        label: "Reader / Writer",
        icon: "📚",
        description: "You prefer reading and structured notes.",
      },
      active: {
        type: "active",
        label: "Active Learner",
        icon: "🤸",
        description: "You learn by doing and practicing.",
      },
    };

    learnerType = map[winner];
    step = "result";
    saveQuizResult(winner);
  }

  async function saveQuizResult(winner) {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, winner }),
      });
    } catch (err) {
      console.error("Failed to save quiz result:", err);
    }
  }

  function proceedToAdopt() {
    step = "adopt";
  }

  async function adoptPet() {
    if (!petName.trim()) {
      alert("Name your pet!");
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/pet/adopt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          petName,
          petEmoji,
        }),
      });
      step = "setup";
    } catch (err) {
      console.error("Failed to adopt pet:", err);
    }
  }

  // ---------------- FILES ----------------

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
    uploadedFiles = uploadedFiles.filter((f) => f !== fileToRemove);
  }

  // ---------------- SESSION ----------------

  function startSession() {
    if (!searchQuery && uploadedFiles.length === 0) {
      alert("Add topic or upload file");
      return;
    }

    if (!searchQuery && uploadedFiles.length > 0) {
      searchQuery = uploadedFiles[0].name.replace(/\.[^/.]+$/, "");
    }

    step = "analyzing";
    scrapeProgress = 0;

    const interval = setInterval(() => {
      scrapeProgress += 5;
      if (scrapeProgress >= 100) {
        clearInterval(interval);
        enterSession();
      }
    }, 50);
  }

  async function enterSession() {
    isLoading = true;
    error = null;
    isSessionActive = true;
    distractionCount = 0;
    petHealth = 100;
    petDies = false;

    try {
      let data;
      if (uploadedFiles.length > 0) {
        // Upload PDF for parsing
        const formData = new FormData();
        formData.append("file", uploadedFiles[0]);
        formData.append("userId", user._id);

        const res = await fetch(`${API_BASE_URL}/api/pdf/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("PDF processing failed");
        data = await res.json();
      } else {
        // Generate from topic
        const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            topic: searchQuery,
            notes: notes,
          }),
        });
        if (!res.ok) throw new Error("AI generation failed");
        data = await res.json();
      }

      generatedContent = data;
      step = "session";
      startFocusTimer();

      document.addEventListener("visibilitychange", handleDistraction);
      window.addEventListener("blur", handleDistraction);
    } catch (err) {
      error = err.message;
      step = "setup";
    } finally {
      isLoading = false;
    }
  }

  // ---------------- FOCUS LOGIC ----------------

  function handleDistraction() {
    if (!isSessionActive || petDies) return;

    if (document.hidden) {
      punishDistraction();
    } else {
      startFocusTimer();
    }
  }

  function punishDistraction() {
    distractionCount++;

    clearTimeout(focusTimer);

    if (distractionCount === 1) {
      petHealth = 60;
    } else if (distractionCount === 2) {
      petHealth = 20;
    } else if (distractionCount >= 3) {
      petHealth = 0;
      petDies = true;
      isSessionActive = false;
    }
  }

  function startFocusTimer() {
    clearTimeout(focusTimer);

    focusTimer = setTimeout(() => {
      if (!document.hidden && petDies) {
        petHealth = 100;
        distractionCount = 0;
        petDies = false;
        isSessionActive = true;
      }
    }, 30000); // 30 seconds revival
  }

  // ---------------- CONTENT GENERATOR ----------------

  function generateLearningContent(learnerType, topic) {
    if (!learnerType) return "";

    switch (learnerType.type) {
      case "visual":
        return `
          <div class="card">
            <h3>📊 Visual Flow for ${topic}</h3>
            <p>Main Idea → Core Concepts → Applications</p>
            <pre>
              ${topic}
                ↓
            Concept A → Concept B
                ↓
            Real World Use
            </pre>
          </div>
        `;

      case "audio":
        return `
          <div class="card">
            <h3>🎧 Podcast Script</h3>
            <p>Imagine explaining ${topic} conversationally to a friend...</p>
          </div>
        `;

      case "read":
        return `
          <div class="card">
            <h3>📚 Detailed Notes on ${topic}</h3>
            <ul>
              <li>Definition</li>
              <li>Core Principles</li>
              <li>Examples</li>
              <li>Applications</li>
            </ul>
          </div>
        `;

      case "active":
        return `
          <div class="card">
            <h3>🤸 Practice Tasks</h3>
            <ol>
              <li>Draw the system</li>
              <li>Explain without notes</li>
              <li>Apply to real life</li>
            </ol>
          </div>
        `;

      default:
        return "";
    }
  }

  onDestroy(() => {
    document.removeEventListener("visibilitychange", handleDistraction);
    window.removeEventListener("blur", handleDistraction);
    clearTimeout(focusTimer);
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

          <div class="field-group">
            <label for="search-query">Learning Topic (Optional)</label>
            <input
              type="text"
              id="search-query"
              bind:value={searchQuery}
              placeholder="e.g. Quantum Physics, Impressionist Art"
              class="text-input"
            />
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
          {#if generatedContent}
            <div class="content-card summary-card">
              <h3>📝 Study Summary</h3>
              <p>{generatedContent.summary}</p>
            </div>

            {#if generatedContent.audio_file}
              <div class="content-card audio-card">
                <h3>🎧 Audio Lecture</h3>
                <audio
                  controls
                  src={`${API_BASE_URL}/${generatedContent.audio_file}`}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            {/if}

            {#if generatedContent.visual_diagram_mermaid}
              <div class="content-card diagram-card">
                <h3>📊 Visual Roadmap</h3>
                <pre class="mermaid-code">
                  {generatedContent.visual_diagram_mermaid}
                </pre>
                <p class="helper-text">{generatedContent.visual_explanation}</p>
              </div>
            {/if}

            <div class="content-card notes-card">
              <h3>📚 Deep Dive Notes</h3>
              <div class="notes-body">
                {@html generatedContent.reader_notes.replace(/\n/g, "<br/>")}
              </div>
            </div>

            {#if generatedContent.practice_exercises && generatedContent.practice_exercises.length > 0}
              <div class="content-card exercise-card">
                <h3>🤸 Practice Exercises</h3>
                <ul>
                  {#each generatedContent.practice_exercises as exercise}
                    <li>{exercise}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if generatedContent.mini_games && generatedContent.mini_games.length > 0}
              <div class="content-card games-card">
                <h3>🎮 Mini Challenges</h3>
                {#each generatedContent.mini_games as game}
                  <div class="game-item">
                    <p><strong>{game.question}</strong></p>
                    <div class="game-options">
                      {#each game.options as option}
                        <button class="game-opt-btn">{option}</button>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else}
            <p>Loading your study materials...</p>
          {/if}
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

  /* AI Content Cards */
  .content-card {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;
    border: 1px solid #f1f5f9;
  }

  .content-card h3 {
    margin-top: 0;
    color: #1e293b;
    font-size: 1.25rem;
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }

  .notes-body {
    line-height: 1.6;
    color: #334155;
  }

  .mermaid-code {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 0.5rem;
    font-family: monospace;
    overflow-x: auto;
    border: 1px solid #e2e8f0;
  }

  .helper-text {
    font-size: 0.9rem;
    color: #64748b;
    font-style: italic;
    margin-top: 0.5rem;
  }

  .audio-card audio {
    width: 100%;
    margin-top: 0.5rem;
  }

  .exercise-card ul {
    padding-left: 1.5rem;
    margin: 0;
  }

  .exercise-card li {
    margin-bottom: 0.5rem;
    color: #475569;
  }

  .game-item {
    background: #f1f5f9;
    padding: 1.25rem;
    border-radius: 0.75rem;
    margin-bottom: 1.25rem;
    border-left: 4px solid #ec4899;
  }

  .game-options {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  .game-opt-btn {
    flex: 1;
    min-width: 120px;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    background: white;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .game-opt-btn:hover {
    background: #eef2ff;
    border-color: #4f46e5;
    color: #4f46e5;
  }
</style>
