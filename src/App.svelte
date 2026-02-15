<script>
  import { onDestroy } from "svelte";

  const API_BASE_URL = "http://localhost:3000";

  let step = "auth"; // 'auth', 'quiz', 'result', 'adopt', 'setup', 'session', 'analyzing'
  let currentQuestion = 0;
  let scores = { audio: 0, visual: 0, read: 0, active: 0 };
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
    // Reset quiz state
    currentQuestion = 0;
    scores = { audio: 0, visual: 0, read: 0, practice: 0 };
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
  let petDies = false; // New: Flag for pet death
  let healthInterval;
  let focusTimer; // New: Timer for sustained focus
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

    const learnerTypeMap = {
      visual: {
        type: "visual",
        label: "Visual Learner",
        icon: "👁️",
        description:
          "You learn best through images, diagrams, charts, and videos.",
      },
      audio: {
        type: "audio",
        label: "Audio Learner",
        icon: "🎧",
        description:
          "You learn best by listening, discussing, and explaining ideas.",
      },
      read: {
        type: "read",
        label: "Reader / Writer",
        icon: "📚",
        description:
          "You prefer reading texts, taking detailed notes, and writing summaries.",
      },
      active: {
        type: "active",
        label: "Active (Kinesthetic) Learner",
        icon: "🤸",
        description:
          "You learn best by doing, moving, building, and practicing.",
      },
    };

    learnerType = learnerTypeMap[winner];

    step = "result";
    saveQuizResult(winner, learnerType);
  }

  async function saveQuizResult(winner, learnerType) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
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
    if (uploadedFiles.length === 0 && !searchQuery) {
      // Allow starting without files if there's a search query
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
      if (!document.hidden && isSessionActive && !petDies && petHealth < 100) {
        petHealth = Math.min(100, petHealth + 1);
      }
    }, 5000);

    startFocusTimer(); // Start the 30-second focus timer

    // Add distraction listeners
    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
    }
  }

  function startFocusTimer() {
    if (focusTimer) clearTimeout(focusTimer); // Clear any existing timer
    focusTimer = setTimeout(() => {
      if (!document.hidden && isSessionActive && !petDies) {
        distractionCount = 0;
        petHealth = 100;
        petDies = false;
        console.log("Sustained focus for 30 seconds: Pet fully revived!");
      }
    }, 30000); // 30 seconds
  }

  function handleVisibilityChange() {
    if (document.hidden && isSessionActive && !petDies) {
      punishDistraction();
    } else if (!document.hidden && isSessionActive && !petDies) {
      startFocusTimer(); // Restart timer if tab becomes visible and not dead
    }
  }

  function handleBlur() {
    if (isSessionActive && !petDies) {
      punishDistraction();
    } else if (isSessionActive && !petDies) {
      startFocusTimer(); // Restart timer if window gains focus and not dead
    }
  }

  function punishDistraction() {
    distractionCount++;
    console.log("Distraction detected:", distractionCount);

    if (focusTimer) clearTimeout(focusTimer); // Clear previous sustained focus timer
    if (!petDies) {
      // Only restart if pet is not dead
      startFocusTimer(); // Restart timer for next 30 seconds focus
    }

    if (distractionCount === 1) {
      petHealth = Math.max(0, petHealth - 40);
    } else if (distractionCount === 2) {
      petHealth = Math.max(0, petHealth - 40);
    } else if (distractionCount >= 3) {
      petHealth = 0;
      petDies = true;
      isSessionActive = false; // Session ends when pet dies
      if (healthInterval) clearInterval(healthInterval); // Stop health gain
      if (focusTimer) clearTimeout(focusTimer); // Clear focus timer on death
    }
  }

  function generateLearningContent(learnerType, topic) {
    let content = "";
    // Sanitize topic for display and dynamic content creation
    const displayTopic =
      topic.length > 30 ? topic.substring(0, 27) + "..." : topic;

    switch (learnerType.type) {
      case "visual":
        content = `
          <div class="card resource-card">
            <h3>Visual Summary: ${displayTopic}</h3>
            <p>Here's a visual breakdown to help you grasp <strong>${displayTopic}</strong>:</p>

            <h4>Flow Diagram:</h4>
            <pre class="code-block">
  ┌─────────────────┐
  │  Main Topic: ${displayTopic}   │
  └─────────┬───────┘
            │
  ┌─────────▼─────────┐
  │   Concept A (Key) │
  └─────────┬─────────┘
            │
            │  Relates to
            │  (via X)
            ▼
  ┌─────────▼─────────┐
  │   Concept B (Sub) │
  └─────────┬─────────┘
            │
            │  Leads to
            │  (result in Y)
            ▼
  ┌─────────▼─────────┐
  │   Application Z   │
  └─────────────────┘
            </pre>

            <h4>Step-by-Step Diagram:</h4>
            <ol class="step-diagram">
              <li><strong>Step 1: Understand the Basics</strong>
                <p>Start by identifying the core definitions and principles of ${displayTopic}.</p>
                <img src="https://via.placeholder.com/150/FFC0CB/000000?text=Basic+Concept" alt="Basic Concept Illustration" class="concept-image">
              </li>
              <li><strong>Step 2: Explore Connections</strong>
                <p>Map out how different sub-topics within ${displayTopic} interrelate.</p>
                <img src="https://via.placeholder.com/150/ADD8E6/000000?text=Connections+Map" alt="Connections Map Illustration" class="concept-image">
              </li>
              <li><strong>Step 3: Practical Application</strong>
                <p>See how ${displayTopic} is applied in real-world scenarios or problems.</p>
                <img src="https://via.placeholder.com/150/90EE90/000000?text=Application+Diagram" alt="Application Diagram Illustration" class="concept-image">
              </li>
            </ol>

            <h4>Concept Mapping Structure:</h4>
            <p>Imagine a central idea branching out. For ${displayTopic}:</p>
            <ul class="concept-map-list">
              <li><strong>Central Idea:</strong> ${displayTopic}
                <ul>
                  <li><strong>Branch 1 (Foundation):</strong> Key Theories
                    <ul>
                      <li>Sub-point 1.1: Definition X</li>
                      <li>Sub-point 1.2: Principle Y</li>
                    </ul>
                  </li>
                  <li><strong>Branch 2 (Components):</strong> Core Elements
                    <ul>
                      <li>Sub-point 2.1: Element A</li>
                      <li>Sub-point 2.2: Element B</li>
                    </ul>
                  </li>
                  <li><strong>Branch 3 (Outcome):</strong> Impact & Use Cases
                    <ul>
                      <li>Sub-point 3.1: Effect P</li>
                      <li>Sub-point 3.2: Scenario Q</li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
            <p>Focus on creating mental images or actual sketches!</p>
          </div>
        `;
        break;
      case "audio":
        content = `
          <div class="card resource-card">
            <h3>🎧 Podcast Script: Unpacking ${displayTopic}</h3>
            <p class="conversational-intro">
              "Welcome to 'MindFlow Insights,' your auditory guide to mastering new concepts.
              Today, we're diving deep into <strong>${displayTopic}</strong>.
              Imagine you're having a coffee with an expert who's about to demystify this for you..."
            </p>

            <h4>Main Segment: Conversational Explanation</h4>
            <p>
              "So, let's start with the big picture. What *is* ${displayTopic}?
              At its heart, it's about [explain core concept in simple, engaging terms].
              Think of it like [analogy]. If that's the foundation, then [sub-concept] is like [another analogy].
              It’s less about memorizing facts and more about understanding the rhythm and flow of these ideas.
              The most common question people ask is, 'How does X relate to Y?' Well, the connection is [explain connection]."
            </p>
            <p>
              "When you hear people talk about ${displayTopic}, they often bring up [common term].
              But what they really mean is [clarify misunderstanding]. It's a subtle distinction, but crucial."
            </p>

            <h4>Quick Recap (Audio Bites):</h4>
            <ul>
              <li><strong>Key Idea 1:</strong> ${displayTopic} as [brief verbal summary].</li>
              <li><strong>Core Principle:</strong> Remember [main principle] – it’s the beat of the topic.</li>
              <li><strong>Actionable Insight:</strong> How to apply [specific part] in conversation.</li>
            </ul>

            <h4>Reflection Questions (Think & Speak):</h4>
            <ul class="reflection-questions">
              <li>How would you explain <strong>${displayTopic}</strong> to a friend who knows nothing about it?</li>
              <li>What part of <strong>${displayTopic}</strong> resonated most with you, and why?</li>
              <li>Can you think of a real-world scenario where you've experienced an aspect of <strong>${displayTopic}</strong>, even unknowingly?</li>
              <li>What's one question you still have after this explanation?</li>
            </ul>
            <p class="call-to-action">
              Try vocalizing your answers or discussing them with someone!
            </p>
          </div>
        `;
        break;
      case "read":
        content = `
          <div class="card resource-card">
            <h3>📚 Detailed Notes: Mastering ${displayTopic}</h3>
            <p>A comprehensive written guide designed for in-depth understanding and retention.</p>

            <h4>1. Introduction to ${displayTopic}</h4>
            <p><strong>Definition:</strong> ${displayTopic} can be formally defined as [insert precise definition here, referencing key terms]. It represents [brief overview of its significance or function].</p>
            <p><strong>Context:</strong> This concept is typically encountered in [field/domain] and is fundamental to understanding [broader subject].</p>

            <h4>2. Core Principles & Components</h4>
            <ul>
              <li><strong>Principle Alpha:</strong> [Detailed explanation of Principle Alpha, including its origin and implications].
                <ul>
                  <li><em>Sub-point:</em> How Principle Alpha interacts with [related concept].</li>
                  <li><em>Example:</em> An illustration of Principle Alpha in action [provide a concise example].</li>
                </ul>
              </li>
              <li><strong>Principle Beta:</strong> [Detailed explanation of Principle Beta, focusing on its mechanism and purpose].
                <ul>
                  <li><em>Sub-point:</em> Common misconceptions regarding Principle Beta.</li>
                  <li><em>Application:</em> Where Principle Beta is most effectively utilized.</li>
                </ul>
              </li>
            </ul>

            <h4>3. Key Definitions:</h4>
            <dl class="definitions-list">
              <dt>Term 1:</dt>
              <dd>[Clear and concise definition of Term 1].</dd>
              <dt>Term 2:</dt>
              <dd>[Clear and concise definition of Term 2].</dd>
              <dt>Term 3:</dt>
              <dd>[Clear and concise definition of Term 3].</dd>
            </dl>

            <h4>4. Bullet Breakdown: Key Takeaways</h4>
            <ul>
              <li>${displayTopic} is essential for [reason 1].</li>
              <li>It operates on the basis of [mechanism/theory].</li>
              <li>Distinguish between [common confusion 1] and [common confusion 2].</li>
              <li>Remember the three primary applications: [App 1], [App 2], and [App 3].</li>
            </ul>

            <h4>5. Summary</h4>
            <p>In summary, <strong>${displayTopic}</strong> is a pivotal concept in [field], characterized by [key features]. Its mastery requires understanding its core principles, precise definitions, and practical applications in [context]. Effective engagement with this material will solidify your comprehension.</p>
            <p class="call-to-action">
              Read these notes carefully, highlight key sections, and try to summarize each section in your own words!
            </p>
          </div>
        `;
        break;
      case "active":
        content = `
          <div class="card resource-card">
            <h3>🤸 Active Learning Challenges: Engage with ${displayTopic}</h3>
            <p>Put your knowledge into action with these interactive tasks and exercises!</p>

            <h4>Mini-Exercise: Diagram Completion</h4>
            <p><strong>Task:</strong> On a piece of paper, draw a simple diagram illustrating the main components or stages of <strong>${displayTopic}</strong>. Don't look at your notes!</p>
            <details>
              <summary>Click to reveal key components (after your attempt!)</summary>
              <p><em>(Hint: Consider the flow, inputs, and outputs of the topic.)</em></p>
              <ul>
                <li>Component 1: [Placeholder]</li>
                <li>Component 2: [Placeholder]</li>
                <li>Component 3: [Placeholder]</li>
              </ul>
            </details>

            <h4>Scenario-Based Task: Problem Solver</h4>
            <p><strong>Scenario:</strong> You are [role] facing [problem] related to <strong>${displayTopic}</strong>. Describe the steps you would take to address this situation using your understanding of the topic.</p>
            <details>
              <summary>Brainstorming Prompts (Click to reveal)</summary>
              <p>Consider:</p>
              <ul>
                <li>What data would you need?</li>
                <li>Which principles of ${displayTopic} apply directly?</li>
                <li>What are the potential pitfalls, and how would you mitigate them?</li>
              </ul>
            </details>

            <h4>Interactive Challenge: Quick Quiz</h4>
            <p>Answer these questions without consulting your notes. Be honest with yourself!</p>
            <ol>
              <li>What is the primary function of [a key term in ${displayTopic}]?</li>
              <li>Describe a situation where an understanding of <strong>${displayTopic}</strong> is critical.</li>
              <li>If [condition], what outcome would you expect based on <strong>${displayTopic}</strong>?</li>
            </ol>
            <details>
              <summary>Self-Check Answers (Click to reveal)</summary>
              <p><em>(Provide concise answers here for self-assessment)</em></p>
            </details>

            <h4>"Try This Now" Activity: Live Experiment / Observation</h4>
            <p><strong>Activity:</strong> Find a real-world example of <strong>${displayTopic}</strong> around you (e.g., observe a system, a process, a conversation). Spend 5 minutes analyzing it through the lens of what you've learned.</p>
            <p class="call-to-action">
              The best way to learn is by doing! Actively engage with these prompts.
            </p>
          </div>
        `;
        break;
      default:
        content = `<div class="card resource-card"><h3>General Study Guide: ${displayTopic}</h3><p>A comprehensive overview for your study session on ${displayTopic}.</p></div>`;
    }
    return content;
  }

  onDestroy(() => {
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      clearInterval(healthInterval);
      clearInterval(focusTimer); // Clear focus timer on destroy
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
    color: #9ca3af; /* Gray 400 */
  }

  .link-btn {
    background: none;
    border: none;
    color: #22d3ee; /* Neon Cyan */
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    font-size: inherit;
  }

  .link-btn:hover {
    color: #a78bfa; /* Purple Glow */
  }

  .auth-preview {
    text-align: center;
    animation: float 3s ease-in-out infinite;
  }

  .auth-preview p {
    color: #9ca3af;
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
    color: #1e293b; /* Slate 800 */
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
    background: linear-gradient(to right, #ec4899, #f59e0b);
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
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .quiz-option:hover {
    border-color: #ec4899; /* Pink 500 */
    background: #fff1f2; /* Rose 50 */
    color: #be185d;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.1);
  }

  .progress-bar {
    width: 200px;
    height: 8px;
    background: #e2e8f0; /* Slate 200 */
    border-radius: 4px;
    margin: 1rem auto 0;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #ec4899; /* Pink 500 */
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
    background: rgba(255, 255, 255, 0.8); /* Gray 800 */
    transition: all 0.2s ease;
  }

  .pet-option-btn:hover {
    transform: scale(1.1);
    background: #fff1f2; /* Rose 50 */
  }

  .pet-option-btn.selected {
    border-color: #ec4899;
    background: rgba(236, 72, 153, 0.1);
    box-shadow: 0 0 15px rgba(236, 72, 153, 0.2);
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
    width: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: sticky;
    top: 2rem;
    padding-top: 2rem;
    flex-shrink: 0;
  }

  .pet-mascot {
    font-size: 12rem;
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
      font-size: 6rem;
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
    width: 90%;
    margin-top: -1rem;
    margin-bottom: 2rem;
    position: relative;
    z-index: 5;
  }

  .health-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.5rem;
  }

  .health-bar-bg {
    width: 100%;
    height: 24px;
    background: #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
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
  /* Session Dashboard */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
  }

  .badge {
    display: inline-block;
    background: rgba(236, 72, 153, 0.1);
    color: #ec4899; /* Pink 500 */
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 600;
    width: fit-content;
  }

  .timer-badge {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981; /* Green 500 */
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
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .video-card {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.6);
    transition: transform 0.2s;
    cursor: pointer;
  }

  .video-card:hover {
    transform: translateY(-5px);
    border-color: #ec4899;
    box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.15);
  }

  .video-thumbnail {
    width: 100%;
    aspect-ratio: 16/9;
    background: rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 2rem;
  }

  .video-info {
    padding: 1rem;
    text-align: left;
  }

  .video-info h4 {
    font-size: 0.95rem;
    margin: 0 0 0.5rem 0;
    color: #1e293b;
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
</style>
