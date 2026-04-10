// ─────────────────────────────────────────────────────────────────────────────
//  Lex — GED ELA Study Coach  |  app.js
// ─────────────────────────────────────────────────────────────────────────────

const chatArea    = document.getElementById("chatArea");
const messages    = document.getElementById("messages");
const userInput   = document.getElementById("userInput");
const sendBtn     = document.getElementById("sendBtn");
const clearBtn    = document.getElementById("clearBtn");
const welcomeCard = document.getElementById("welcomeCard");
const menuBtn     = document.getElementById("menuBtn");
const sidebar     = document.getElementById("sidebar");
const sidebarClose = document.getElementById("sidebarClose");
const statusDot   = document.getElementById("statusDot");

// Topic prompts for sidebar buttons
const TOPIC_PROMPTS = {
  reading:    "Let's work on Reading for Meaning. Can you explain how to find the main idea in a passage?",
  analysis:   "I want to practice Text Analysis — like identifying an author's purpose or analyzing theme.",
  grammar:    "Let's review Grammar & Language rules. Where should I start?",
  vocabulary: "Help me improve my Vocabulary skills, especially using context clues.",
  writing:    "I want to improve my Writing Skills. Can you walk me through the basics?",
  essay:      "Explain Essay Structure for the GED Extended Response. How do I organize my ideas?",
};

// ── Conversation history (sent to server) ────────────────────────────────────
let conversationHistory = [];
let isStreaming = false;

// ── Overlay element (mobile sidebar) ─────────────────────────────────────────
const overlay = document.createElement("div");
overlay.className = "overlay";
document.body.appendChild(overlay);

// ── Utility: basic Markdown → HTML (no external library needed) ──────────────
function parseMarkdown(text) {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Numbered list lines
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Bullet list lines
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Paragraphs (double newline)
    .replace(/\n\n/g, "</p><p>")
    // Single newlines
    .replace(/\n/g, "<br>");
}

// ── Create message bubble ─────────────────────────────────────────────────────
function createBubble(role, content = "") {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "assistant" ? "✦" : "U";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (content) {
    bubble.innerHTML = `<p>${parseMarkdown(content)}</p>`;
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  return { msg, bubble };
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function showTyping() {
  const { msg, bubble } = createBubble("assistant");
  msg.classList.add("typing-indicator");
  msg.id = "typingIndicator";
  bubble.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  messages.appendChild(msg);
  scrollToBottom();
  return msg;
}

function removeTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ── Scroll helper ─────────────────────────────────────────────────────────────
function scrollToBottom() {
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });
}

// ── Hide welcome card once chatting ──────────────────────────────────────────
function hideWelcome() {
  if (welcomeCard && welcomeCard.style.display !== "none") {
    welcomeCard.style.opacity = "0";
    welcomeCard.style.transition = "opacity 0.3s ease";
    setTimeout(() => { welcomeCard.style.display = "none"; }, 300);
  }
}

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage(overrideText) {
  const text = (overrideText || userInput.value).trim();
  if (!text || isStreaming) return;

  hideWelcome();

  // Add user message to UI
  const { msg: userMsg } = createBubble("user", text);
  messages.appendChild(userMsg);
  userInput.value = "";
  autoResize();
  sendBtn.disabled = true;
  scrollToBottom();

  // Add to history
  conversationHistory.push({ role: "user", content: text });

  // Show typing dots
  isStreaming = true;
  const typingEl = showTyping();

  // Create assistant bubble (will be filled by stream)
  let assistantText = "";
  let assistantBubble = null;
  let assistantMsg = null;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Remove typing indicator & add real bubble on first chunk
    let bubbleReady = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      const lines = raw.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const json = line.slice(6).trim();
        try {
          const data = JSON.parse(json);

          if (data.error) throw new Error(data.error);

          if (data.text) {
            if (!bubbleReady) {
              removeTyping();
              const created = createBubble("assistant");
              assistantMsg    = created.msg;
              assistantBubble = created.bubble;
              messages.appendChild(assistantMsg);
              bubbleReady = true;
            }
            assistantText += data.text;
            assistantBubble.innerHTML = `<p>${parseMarkdown(assistantText)}</p>`;
            scrollToBottom();
          }

          if (data.done) break;
        } catch {
          // partial chunk — skip
        }
      }
    }

    // Add completed assistant response to history
    if (assistantText) {
      conversationHistory.push({ role: "assistant", content: assistantText });
    }

  } catch (err) {
    removeTyping();
    console.error("Chat error:", err);

    const { msg: errMsg, bubble: errBubble } = createBubble("assistant");
    errBubble.innerHTML = `<p>Sorry, I ran into a problem connecting. Please try again in a moment. <em>(${err.message})</em></p>`;
    messages.appendChild(errMsg);
    scrollToBottom();
  } finally {
    isStreaming = false;
    updateSendBtn();
  }
}

// ── Textarea auto-resize ──────────────────────────────────────────────────────
function autoResize() {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
}

function updateSendBtn() {
  sendBtn.disabled = userInput.value.trim() === "" || isStreaming;
}

// ── Keyboard: Enter to send, Shift+Enter for newline ─────────────────────────
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

userInput.addEventListener("input", () => {
  autoResize();
  updateSendBtn();
});

sendBtn.addEventListener("click", () => sendMessage());

// ── Quick-start buttons ───────────────────────────────────────────────────────
document.querySelectorAll(".quick-btn").forEach((btn) => {
  btn.addEventListener("click", () => sendMessage(btn.dataset.prompt));
});

// ── Topic nav buttons ─────────────────────────────────────────────────────────
document.querySelectorAll(".topic-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = TOPIC_PROMPTS[btn.dataset.topic];
    if (prompt) {
      closeSidebar();
      sendMessage(prompt);
    }
  });
});

// ── Clear / new session ───────────────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  conversationHistory = [];
  messages.innerHTML = "";
  welcomeCard.style.display = "";
  welcomeCard.style.opacity = "1";
  closeSidebar();
});

// ── Sidebar (mobile) ──────────────────────────────────────────────────────────
function openSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

menuBtn.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

// ── Status check ──────────────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      statusDot.classList.remove("offline");
      statusDot.title = "Connected";
    } else {
      throw new Error();
    }
  } catch {
    statusDot.classList.add("offline");
    statusDot.title = "Disconnected";
  }
}

checkHealth();
