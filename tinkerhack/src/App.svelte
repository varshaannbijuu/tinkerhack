<script>
  import { onMount, onDestroy } from "svelte";

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // ---------------- GLOBAL STATE ----------------
  let isLoading = false;
  let error = null;
  let user = null;

  let step = "auth";
  // auth | quiz | result | adopt | setup | analyzing | session

  // ---------------- AUTH ----------------
  let email = "";
  let password = "";
  let username = "";
  let isSignUp = true;

  // ---------------- QUIZ ----------------
  let currentQuestion = 0;
  let scores = { audio: 0, visual: 0, read: 0, active: 0 };
  let learnerType = null;

  // ---------------- PET ----------------
  let petName = "";
  let petEmoji = "🐶";
  let petHealth = 100;
  let isSessionActive = false;
  let petDies = false; // Flag for pet death
  let focusIntervalId; // Stores the interval ID for sustained focus
  let focusTimer = 0; // Counts seconds of continuous focus
  let distractionCount = 0; // counts tab switches/blurs

  const petOptions = [
    { emoji: "🐶", label: "Dog" },
    { emoji: "🐱", label: "Cat" },
    { emoji: "🐵", label: "Monkey" },
    { emoji: "🐼", label: "Panda" },
  ];

  // ---------------- SESSION ----------------

  let uploadedFiles = [];
  let fileInput;
  let searchQuery = "";
  let scrapeProgress = 0;
  let notes = ""; // ✅ REQUIRED FOR bind:value
  let generatedContent = { title: "", sections: [] }; // Dynamically generated content for session

  // ---------------- AUTH ----------------

  async function handleAuth() {
    error = null;

    if (!email || !password || (isSignUp && !username)) {
      error = "Please fill all fields";
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

      // helper map for reconstruction
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

      if (user.learningStyle && user.pet) {
        learnerType = learnerTypeMap[user.learningStyle];
        petName = user.pet.name;
        petEmoji = user.pet.emoji || user.pet.petType; // Fallback
        step = "setup";
      } else if (user.learningStyle) {
        learnerType = learnerTypeMap[user.learningStyle];
        step = "adopt";
      } else {
        step = "quiz";
      }
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function logout() {
    localStorage.removeItem("user");
    user = null;
    step = "auth";
  }

  // ---------------- QUIZ ----------------

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

  async function finishQuiz() {
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
    try {
      await fetch(`${API_BASE_URL}/api/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          scores,
          result: learnerType, // Send the full structured object
        }),
      });
    } catch (err) {
      console.error("Quiz save failed:", err);
    }

    step = "result";
  }

  function proceedToAdopt() {
    step = "adopt";
  }

  // ---------------- PET ----------------

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
      console.error("Pet save failed:", err);
    }
  }

  // ---------------- FILES ----------------

  function handleFileSelect(event) {
    uploadedFiles = Array.from(event.target.files);
  }

  function handleDrop(event) {
    uploadedFiles = Array.from(event.dataTransfer.files);
  }

  function removeFile(fileToRemove) {
    uploadedFiles = uploadedFiles.filter((file) => file !== fileToRemove);
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user._id);

    await fetch(`${API_BASE_URL}/api/pdf/upload`, {
      method: "POST",
      body: formData,
    });
  }

  // ---------------- SESSION ----------------

  async function startSession() {
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
      scrapeProgress += 5; // Reduced from 10 to 5 for smoother animation
      if (scrapeProgress >= 100) {
        clearInterval(interval);
        enterSession();
      }
    }, 100); // Increased from 150 to 100 for faster simulation
  }

  function enterSession() {
    step = "session";
    isSessionActive = true;
    distractionCount = 0; // Reset distraction count for new session
    generatedContent = generateLearningContent(learnerType, searchQuery); // Generate learning content
    console.log("Notes generated"); // Log that notes have been generated
    // No need to call createSession here, as it was previously called in startSession, now integrated.
    // Ensure that createSession API call handles the new generatedNotes if needed by backend.

    startFocusTimer(); // Start the 30-second focus timer for revival
  }

  function startFocusTimer() {
    // Clear any existing interval when focus is (re)gained or initiated
    if (focusIntervalId) {
      clearInterval(focusIntervalId);
    }
    focusTimer = 0; // Reset focus timer on focus regain or start

    if (petDies) return; // Don't start timer if pet is dead

    // Start a new interval to check for sustained focus
    focusIntervalId = setInterval(() => {
      // Only increment if session is active and not hidden
      if (isSessionActive && !document.hidden) {
        focusTimer++;

        // Gradual healing: +1 HP every 2 seconds if under 100
        if (focusTimer % 2 === 0 && petHealth < 100) {
          petHealth = Math.min(100, petHealth + 1);
        }

        if (focusTimer >= 30) {
          // Pet fully revived after 30 seconds of continuous focus
          distractionCount = 0;
          petHealth = 100;
          petDies = false;
          console.log(
            "✨ Sustained focus for 30 seconds: Pet fully revived! HP restored to 100%",
          );
          clearInterval(focusIntervalId); // Stop the timer after revival
          focusTimer = 0; // Reset timer
        }
      } else {
        // If the session is not active or tab is hidden, reset the focus timer.
        // This ensures continuous focus is truly continuous.
        focusTimer = 0;
      }
    }, 1000); // Check every second
  }

  // Lifecycle listeners
  onMount(() => {
    // These listeners should be active whenever a session *could* be active,
    // but their actions are guarded by `isSessionActive` and `!petDies` checks.
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus); // New: handle window focus
  });

  onDestroy(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleBlur);
    window.removeEventListener("focus", handleFocus);
    if (focusIntervalId) {
      clearInterval(focusIntervalId);
    }
  });

  function handleFocus() {
    // When window regains focus, and a session is active and pet is not dead,
    // attempt to start/restart the focus timer for revival.
    if (isSessionActive && !petDies) {
      startFocusTimer();
    }
  }

  function handleVisibilityChange() {
    if (document.hidden && isSessionActive && !petDies) {
      punishDistraction();
    } else if (!document.hidden && isSessionActive && !petDies) {
      // Tab became visible, restart focus timer for potential revival
      startFocusTimer();
    }
  }

  function handleBlur() {
    if (isSessionActive && !petDies) {
      // Window lost focus, consider it a distraction
      punishDistraction();
    }
    // No else if to start timer here; handleFocus will take care of it when focus is regained.
  }

  function punishDistraction() {
    distractionCount++;
    console.log("🚨 Distraction detected! Count:", distractionCount);

    if (focusIntervalId) {
      // Clear the continuous focus interval
      clearInterval(focusIntervalId);
      focusIntervalId = null;
    }
    focusTimer = 0; // Reset focus timer

    if (distractionCount === 1) {
      petHealth = 60; // First distraction: 100 -> 60 (40% loss)
      console.log("⚠️ First distraction penalty: HP reduced to 60%");
    } else if (distractionCount === 2) {
      petHealth = 20; // Second distraction: 60 -> 20 (40% loss)
      console.log("⚠️⚠️ Second distraction penalty: HP reduced to 20%");
    } else if (distractionCount >= 3) {
      petHealth = 0;
      petDies = true;
      isSessionActive = false; // Session ends when pet dies
      console.log("💀 Third distraction: Pet has died. Session ended.");
    }
  }

  function generateLearningContent(learnerType, topic) {
    const displayTopic =
      topic.length > 30 ? topic.substring(0, 27) + "..." : topic;

    let content = {
      title: "",
      sections: [],
      tasks: [],
    };

    switch (learnerType.type) {
      case "visual":
        content.title = `Visual Roadmap: ${displayTopic}`;
        content.tasks = [
          "Create a mind map with ${displayTopic} at the center",
          "Color-code three main branches of this topic",
          "Find an infographic that explains one core concept visually",
        ];
        content.sections = [
          {
            heading: "Visual Summary",
            type: "paragraph",
            content: `Here's a visual breakdown to help you grasp <strong>${displayTopic}</strong>:`,
          },
          {
            heading: "Flow Diagram",
            type: "code",
            content: `
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
            `,
          },
          {
            heading: "Key Visual Anchors",
            type: "image-group", // Custom type for rendering images
            content: [
              {
                title: "Step 1: Understand the Basics",
                description: `Start by identifying the core definitions and principles of ${displayTopic}.`,
                image:
                  "https://via.placeholder.com/150/FFC0CB/000000?text=Basic+Concept",
              },
              {
                title: "Step 2: Explore Connections",
                description: `Map out how different sub-topics within ${displayTopic} interrelate.`,
                image:
                  "https://via.placeholder.com/150/ADD8E6/000000?text=Connections+Map",
              },
              {
                title: "Step 3: Practical Application",
                description: `See how ${displayTopic} is applied in real-world scenarios or problems.`,
                image:
                  "https://via.placeholder.com/150/90EE90/000000?text=Application+Diagram",
              },
            ],
          },
          {
            heading: "Concept Mapping Structure",
            type: "list",
            content: [
              `<strong>Central Idea:</strong> ${displayTopic}`,
              `<strong>Branch 1 (Foundation):</strong> Key Theories
                <ul>
                  <li>Sub-point 1.1: Definition X</li>
                  <li>Sub-point 1.2: Principle Y</li>
                </ul>`,
              `<strong>Branch 2 (Components):</strong> Core Elements
                <ul>
                  <li>Sub-point 2.1: Element A</li>
                  <li>Sub-point 2.2: Element B</li>
                </ul>`,
              `<strong>Branch 3 (Outcome):</strong> Impact & Use Cases
                <ul>
                  <li>Sub-point 3.1: Effect P</li>
                  <li>Sub-point 3.2: Scenario Q</li>
                </ul>`,
            ],
          },
          {
            heading: "",
            type: "paragraph",
            content: "Focus on creating mental images or actual sketches!",
          },
        ];
        break;
      case "audio":
        content.title = `🎧 Podcast Style: Unpacking ${displayTopic}`;
        content.tasks = [
          "Explain ${displayTopic} out loud to an imaginary audience",
          "Record a 1-minute voice note summarizing the main idea",
          "Find a podcast clip or video explaining this topic",
        ];
        content.sections = [
          {
            heading: "Conversational Explanation",
            type: "paragraph",
            content: `
              "Welcome to 'MindFlow Insights,' your auditory guide to mastering new concepts.
              Today, we're diving deep into <strong>${displayTopic}</strong>.
              Imagine you're having a coffee with an expert who's about to demystify this for you...
              So, let's start with the big picture. What *is* ${displayTopic}?
              At its heart, it's about [explain core concept in simple, engaging terms].
              Think of it like [analogy]. If that's the foundation, then [sub-concept] is like [another analogy].
              It’s less about memorizing facts and more about understanding the rhythm and flow of these ideas.
              The most common question people ask is, 'How does X relate to Y?' Well, the connection is [explain connection].
              When you hear people talk about ${displayTopic}, they often bring up [common term].
              But what they really mean is [clarify misunderstanding]. It's a subtle distinction, but crucial."
            `,
          },
          {
            heading: "Quick Recap (Audio Bites)",
            type: "list",
            content: [
              `<strong>Key Idea 1:</strong> ${displayTopic} as [brief verbal summary].`,
              `<strong>Core Principle:</strong> Remember [main principle] – it’s the beat of the topic.`,
              `<strong>Actionable Insight:</strong> How to apply [specific part] in conversation.`,
            ],
          },
          {
            heading: "Reflection Questions (Think & Speak)",
            type: "list",
            content: [
              `How would you explain <strong>${displayTopic}</strong> to a friend who knows nothing about it?`,
              `What part of <strong>${displayTopic}</strong> resonated most with you, and why?`,
              `Can you think of a real-world scenario where you've experienced an aspect of <strong>${displayTopic}</strong>, even unknowingly?`,
              `What's one question you still have after this explanation?`,
            ],
          },
          {
            heading: "",
            type: "paragraph",
            content:
              "Try vocalizing your answers or discussing them with someone!",
          },
        ];
        break;
      case "read":
        content.title = `📚 Structural Notes: ${displayTopic}`;
        content.tasks = [
          "Write a 150-word summary of ${displayTopic}",
          "Identify and define 5 key terms in your own words",
          "Create an outline using Roman numerals for the sub-topics",
        ];
        content.sections = [
          {
            heading: "1. Introduction to " + displayTopic,
            type: "paragraph",
            content: `
              <strong>Definition:</strong> ${displayTopic} can be formally defined as [insert precise definition here, referencing key terms]. It represents [brief overview of its significance or function].
              <strong>Context:</strong> This concept is typically encountered in [field/domain] and is fundamental to understanding [broader subject].
            `,
          },
          {
            heading: "2. Core Principles & Components",
            type: "list",
            content: [
              `<strong>Principle Alpha:</strong> [Detailed explanation of Principle Alpha, including its origin and implications].
                <ul>
                  <li><em>Sub-point:</em> How Principle Alpha interacts with [related concept].</li>
                  <li><em>Example:</em> An illustration of Principle Alpha in action [provide a concise example].</li>
                </ul>`,
              `<strong>Principle Beta:</strong> [Detailed explanation of Principle Beta, focusing on its mechanism and purpose].
                <ul>
                  <li><em>Sub-point:</em> Common misconceptions regarding Principle Beta.</li>
                  <li><em>Application:</em> Where Principle Beta is most effectively utilized.</li>
                </ul>`,
            ],
          },
          {
            heading: "3. Key Definitions:",
            type: "definitions", // Custom type for dl/dt/dd
            content: [
              {
                term: "Term 1",
                definition: "[Clear and concise definition of Term 1].",
              },
              {
                term: "Term 2",
                definition: "[Clear and concise definition of Term 2].",
              },
              {
                term: "Term 3",
                definition: "[Clear and concise definition of Term 3].",
              },
            ],
          },
          {
            heading: "4. Bullet Breakdown: Key Takeaways",
            type: "list",
            content: [
              `${displayTopic} is essential for [reason 1].`,
              `It operates on the basis of [mechanism/theory].`,
              `Distinguish between [common confusion 1] and [common confusion 2].`,
              `Remember the three primary applications: [App 1], [App 2], and [App 3].`,
            ],
          },
          {
            heading: "5. Summary",
            type: "paragraph",
            content: `In summary, <strong>${displayTopic}</strong> is a pivotal concept in [field], characterized by [key features]. Its mastery requires understanding its core principles, precise definitions, and practical applications in [context]. Effective engagement with this material will solidify your comprehension.`,
          },
          {
            heading: "",
            type: "paragraph",
            content:
              "Read these notes carefully, highlight key sections, and try to summarize each section in your own words!",
          },
        ];
        break;
      case "active":
        content.title = `🤸 Hands-on Challenges: ${displayTopic}`;
        content.tasks = [
          "Perform a quick 2-minute 'teach-back' to confirm understanding",
          "Apply ${displayTopic} to a real-world scenario you encountered today",
          "Sketch a quick diagram or model of how this works",
        ];
        content.sections = [
          {
            heading: "Mini-Exercise: Diagram Completion",
            type: "exercise",
            content: {
              instruction: `On a piece of paper, draw a simple diagram illustrating the main components or stages of <strong>${displayTopic}</strong>. Don't look at your notes!`,
              reveal: {
                summary: "Click to reveal key components (after your attempt!)",
                details: `
                  <p><em>(Hint: Consider the flow, inputs, and outputs of the topic.)</em></p>
                  <ul>
                    <li>Component 1: [Placeholder]</li>
                    <li>Component 2: [Placeholder]</li>
                    <li>Component 3: [Placeholder]</li>
                  </ul>
                `,
              },
            },
          },
          {
            heading: "Scenario-Based Task: Problem Solver",
            type: "exercise",
            content: {
              instruction: `<strong>Scenario:</strong> You are [role] facing [problem] related to <strong>${displayTopic}</strong>. Describe the steps you would take to address this situation using your understanding of the topic.`,
              reveal: {
                summary: "Brainstorming Prompts (Click to reveal)",
                details: `
                  <p>Consider:</p>
                  <ul>
                    <li>What data would you need?</li>
                    <li>Which principles of ${displayTopic} apply directly?</li>
                    <li>What are the potential pitfalls, and how would you mitigate them?</li>
                  </ul>
                `,
              },
            },
          },
          {
            heading: "Interactive Challenge: Quick Quiz",
            type: "quiz",
            content: {
              questions: [
                `What is the primary function of [a key term in ${displayTopic}]?`,
                `Describe a situation where an understanding of <strong>${displayTopic}</strong> is critical.`,
                `If [condition], what outcome would you expect based on <strong>${displayTopic}</strong>?`,
              ],
              reveal: {
                summary: "Self-Check Answers (Click to reveal)",
                details: `<p><em>(Provide concise answers here for self-assessment)</em></p>`,
              },
            },
          },
          {
            heading: `"Try This Now" Activity: Live Experiment / Observation`,
            type: "paragraph",
            content: `<strong>Activity:</strong> Find a real-world example of <strong>${displayTopic}</strong> around you (e.g., observe a system, a process, a conversation). Spend 5 minutes analyzing it through the lens of what you've learned.`,
          },
          {
            heading: "",
            type: "paragraph",
            content:
              "The best way to learn is by doing! Actively engage with these prompts.",
          },
        ];
        break;
      default:
        content.title = `General Study Guide: ${displayTopic}`;
        content.sections = [
          {
            heading: "Overview",
            type: "paragraph",
            content: `A comprehensive overview for your study session on ${displayTopic}.`,
          },
        ];
    }
    return content;
  }
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

        {#if error}
          <p class="error-message">{error}</p>
        {/if}

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

          <button type="submit" class="cta-btn" disabled={isLoading}>
            {#if isLoading}
              Authenticating...
            {:else}
              {isSignUp ? "Sign Up" : "Log In"}
            {/if}
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
            <span class="badge">{learnerType.label || "General Learner"}</span>
            <h1 class="session-title">{searchQuery}</h1>
          </div>
          <div class="timer-badge">Session Active ⚡</div>
        </header>

        <!-- Dynamic Resource Content -->
        <div class="resource-section">
          {#if generatedContent.tasks && generatedContent.tasks.length > 0}
            <div class="content-section card task-card">
              <h3>🎯 Actionable Tasks</h3>
              <ul class="task-list">
                {#each generatedContent.tasks as task}
                  <li>
                    <label class="task-item">
                      <input type="checkbox" />
                      <span
                        >{@html task.replace(
                          "${displayTopic}",
                          searchQuery,
                        )}</span
                      >
                    </label>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <h2 class="session-content-title">{generatedContent.title}</h2>
          {#each generatedContent.sections as section}
            <div class="content-section card resource-card">
              {#if section.heading}
                <h3>{section.heading}</h3>
              {/if}

              {#if section.type === "paragraph"}
                <p>{@html section.content}</p>
              {:else if section.type === "code"}
                <pre class="code-block">{@html section.content}</pre>
              {:else if section.type === "list"}
                <ul class="styled-list">
                  {#each section.content as item}
                    <li>{@html item}</li>
                  {/each}
                </ul>
              {:else if section.type === "definitions"}
                <dl class="definitions-list">
                  {#each section.content as def}
                    <dt>{def.term}</dt>
                    <dd>{def.definition}</dd>
                  {/each}
                </dl>
              {:else if section.type === "exercise"}
                <div class="exercise-block">
                  <p>{@html section.content.instruction}</p>
                  {#if section.content.reveal}
                    <details>
                      <summary>{section.content.reveal.summary}</summary>
                      <div>{@html section.content.reveal.details}</div>
                    </details>
                  {/if}
                </div>
              {:else if section.type === "quiz"}
                <div class="quiz-block">
                  <ol>
                    {#each section.content.questions as q}
                      <li>{@html q}</li>
                    {/each}
                  </ol>
                  {#if section.content.reveal}
                    <details>
                      <summary>{section.content.reveal.summary}</summary>
                      <div>{@html section.content.reveal.details}</div>
                    </details>
                  {/if}
                </div>
              {:else if section.type === "image-group"}
                <div class="image-group-container">
                  {#each section.content as imgItem}
                    <div class="image-card">
                      <h4>{imgItem.title}</h4>
                      <p>{imgItem.description}</p>
                      <img
                        src={imgItem.image}
                        alt={imgItem.title}
                        class="concept-image"
                      />
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <footer class="footer">
    <p>AI Study Commander • TinkerHack 2026</p>
  </footer>

  {#if user}
    <div style="margin-top: 2rem; text-align: center;">
      <button class="link-btn" on:click={logout}>Logout</button>
    </div>
  {/if}
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
    color: #e5e7eb; /* Soft White */
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

  .error-message {
    color: #ef4444; /* Red 500 */
    background-color: #fef2f2; /* Red 50 */
    border: 1px solid #ef4444;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 500;
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

  /* Generated Learning Content Styles (Global for @html) */
  :global(.resource-card) {
    background: rgba(255, 255, 255, 0.9) !important;
    padding: 2rem !important;
    border-radius: 1rem !important;
    margin-bottom: 1.5rem !important;
    line-height: 1.6 !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    text-align: left !important;
  }

  :global(.resource-card h3) {
    color: #1e293b !important;
    margin-bottom: 1rem !important;
    font-size: 1.5rem !important;
    font-weight: 700 !important;
  }

  :global(.resource-card h4) {
    color: #334155 !important;
    margin-top: 1.5rem !important;
    margin-bottom: 0.75rem !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
  }

  :global(.code-block) {
    background: #f1f5f9 !important;
    padding: 1rem !important;
    border-radius: 0.5rem !important;
    overflow-x: auto !important;
    font-family: "Courier New", monospace !important;
    font-size: 0.85rem !important;
    color: #334155 !important;
    line-height: 1.4 !important;
    margin: 1rem 0 !important;
  }

  :global(.step-diagram) {
    list-style: decimal !important;
    padding-left: 2rem !important;
    margin: 1rem 0 !important;
  }

  :global(.step-diagram li) {
    margin-bottom: 1rem !important;
  }

  :global(.concept-image) {
    max-width: 100% !important;
    border-radius: 0.5rem !important;
    margin-top: 0.5rem !important;
    display: block !important;
  }

  :global(.conversational-intro) {
    font-style: italic !important;
    color: #64748b !important;
    background: #f8fafc !important;
    padding: 1rem !important;
    border-left: 4px solid #ec4899 !important;
    border-radius: 0.5rem !important;
    margin: 1rem 0 !important;
  }

  :global(.reflection-questions) {
    background: #fef3c7 !important;
    padding: 1.25rem !important;
    border-radius: 0.75rem !important;
    border-left: 4px solid #f59e0b !important;
    margin: 1.5rem 0 !important;
  }

  :global(.call-to-action) {
    background: #dbeafe !important;
    color: #1e40af !important;
    padding: 0.75rem 1rem !important;
    border-radius: 0.5rem !important;
    font-weight: 600 !important;
    text-align: center !important;
    margin-top: 1.5rem !important;
  }

  :global(.definitions-list) {
    background: #f8fafc !important;
    padding: 1rem !important;
    border-radius: 0.5rem !important;
    border: 1px solid #e2e8f0 !important;
  }

  :global(details) {
    background: #f8fafc !important;
    padding: 0.75rem !important;
    border-radius: 0.5rem !important;
    margin-top: 0.75rem !important;
    border: 1px solid #e2e8f0 !important;
  }

  :global(summary) {
    font-weight: 600 !important;
    color: #4f46e5 !important;
    cursor: pointer !important;
  }
  /* Adaptive Content Styling - New specific styles for structured content */
  .session-content-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-top: 2rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .task-card {
    background: linear-gradient(135deg, #fdf2f8 0%, #fae8ff 100%) !important;
    border: 1px solid #fbcfe8 !important;
  }

  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .task-item:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .task-item input {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .task-item span {
    font-size: 1rem;
    color: #475569;
  }

  .content-section {
    margin-bottom: 1.5rem; /* Spacing between sections */
  }

  .content-section h3 {
    font-size: 1.5rem;
    color: #334155;
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 2px solid rgba(236, 72, 153, 0.2);
    padding-bottom: 0.5rem;
  }

  .content-section h4 {
    font-size: 1.2rem;
    color: #475569;
    margin-top: 1.5rem;
    margin-bottom: 0.8rem;
  }

  .content-section p {
    line-height: 1.6;
    margin-bottom: 1rem;
    color: #475569;
  }

  .content-section :global(strong) {
    color: #1e293b;
  }

  .code-block {
    background: #f8fafc; /* Blue Gray 50 */
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem;
    font-family: "Fira Code", "Cascadia Code", monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
    word-break: break-all;
    overflow-x: auto;
    color: #334155;
  }

  .styled-list {
    list-style: none;
    padding-left: 0;
  }

  .styled-list li {
    position: relative;
    padding-left: 1.8rem;
    margin-bottom: 0.7rem;
    line-height: 1.5;
    color: #475569;
  }

  .styled-list li::before {
    content: "•";
    color: #ec4899; /* Pink 500 */
    position: absolute;
    left: 0;
    font-weight: bold;
    font-size: 1.2rem;
    top: -2px;
  }

  .styled-list li :global(ul) {
    margin-top: 0.5rem;
    margin-bottom: 0;
    padding-left: 1.5rem;
  }

  .styled-list li :global(ul li::before) {
    content: "◦";
    color: #f59e0b; /* Amber 500 */
  }

  .definitions-list {
    margin: 1rem 0;
    padding-left: 1rem; /* For alignment with other text */
  }

  .definitions-list dt {
    font-weight: 700;
    color: #1e293b;
    margin-top: 1rem;
  }

  .definitions-list dd {
    margin-left: 1.5rem;
    margin-bottom: 0.5rem;
    color: #475569;
  }

  .exercise-block,
  .quiz-block {
    background: #fef2f2; /* Red 50 */
    border: 1px solid #ef4444; /* Red 500 */
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  .exercise-block details,
  .quiz-block details {
    margin-top: 1rem;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.8rem 1rem;
    cursor: pointer;
  }

  .exercise-block summary,
  .quiz-block summary {
    font-weight: 600;
    color: #ef4444;
  }

  .exercise-block details[open] summary,
  .quiz-block details[open] summary {
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .exercise-block details div,
  .quiz-block details div {
    padding-top: 0.5rem;
    color: #475569;
  }

  .image-group-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
    text-align: center;
  }

  .image-card {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: 0 2px 10px -3px rgba(0, 0, 0, 0.1);
  }

  .image-card img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin-top: 1rem;
    border: 1px solid #e2e8f0;
  }

  .image-card h4 {
    margin: 0;
    font-size: 1rem;
    color: #334155;
  }

  .image-card p {
    font-size: 0.85rem;
    color: #64748b;
  }
</style>
