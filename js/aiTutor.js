// AI Tutor Client-Side Logic

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chat-input");
    const chatSend = document.getElementById("chat-send");
    const chatMessages = document.getElementById("chat-messages");
    const quickPrompts = document.querySelectorAll(".quick-prompt-btn");

    let worker = null;
    let welcomeBubble = null;

    function appendMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message ${sender}`;
        
        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "chat-bubble";
        bubbleDiv.innerHTML = text;
        
        messageDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(messageDiv);
        
        // Auto-scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubbleDiv;
    }

    function showTypingIndicator() {
        const indicatorDiv = document.createElement("div");
        indicatorDiv.className = "chat-message tutor temp-indicator";
        
        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "chat-bubble typing-indicator";
        bubbleDiv.innerHTML = "<span></span><span></span><span></span>";
        
        indicatorDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(indicatorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = chatMessages.querySelector(".temp-indicator");
        if (indicator) {
            indicator.remove();
        }
    }

    // Initialize the Web Worker running the AI model
    function initModel() {
        chatInput.disabled = true;
        chatSend.disabled = true;
        chatInput.placeholder = "Initializing AI model...";

        // Set up welcome/loading bubble
        welcomeBubble = appendMessage("Hi! Please wait a moment while I load the offline AI tutor (~350MB). This download only happens on your first visit.", "tutor");

        try {
            // Instantiate background Web Worker
            worker = new Worker('./js/aiTutorWorker.js', { type: 'module' });

            // Listen for background worker messages
            worker.addEventListener('message', (event) => {
                const { type, data, text, error } = event.data;

                if (type === 'progress') {
                    if (data.status === 'progress') {
                        const filename = data.file.split('/').pop();
                        const percent = Math.round(data.progress);
                        chatInput.placeholder = `Loading: ${filename} (${percent}%)`;
                    } else if (data.status === 'ready') {
                        chatInput.placeholder = "Finalizing pipeline...";
                    }
                } else if (type === 'ready') {
                    // Re-enable UI when loaded
                    chatInput.disabled = false;
                    chatSend.disabled = false;
                    chatInput.placeholder = "Ask a question...";
                    welcomeBubble.innerHTML = "Hi! I am your AI Hydrology Tutor. Ask me any questions about the 1927 Mississippi River flood, protecting critical buildings, or floodproofing strategies!";
                } else if (type === 'result') {
                    removeTypingIndicator();
                    appendMessage(text || "I'm analyzing the simulation parameters. Could you ask that another way?", "tutor");
                } else if (type === 'error') {
                    console.error("Worker error:", error);
                    removeTypingIndicator();
                    chatInput.disabled = false;
                    chatSend.disabled = false;
                    chatInput.placeholder = "Ask a question...";
                    appendMessage("Sorry, I encountered an issue running the offline AI tutor. Please reload the page.", "tutor");
                }
            });

            // Start initialization in worker
            worker.postMessage({ type: 'init' });

        } catch (err) {
            console.error("Failed to spawn Web Worker:", err);
            chatInput.placeholder = "Failed to launch Web Worker.";
            welcomeBubble.innerHTML = "Sorry, I failed to start the offline AI tutor. Please check if your browser supports Web Workers and reload.";
        }
    }

    function handleResponse(userText) {
        if (!worker) {
            appendMessage("The AI Tutor is still loading. Please wait a moment.", "tutor");
            return;
        }

        showTypingIndicator();

        // Build system prompt for Qwen Chat format
        const prompt = `<|im_start|>system
You are a friendly hydrology tutor for middle and high school students playing FloodGame (a simulation of the 1927 Mississippi River flood). Answer the student's question in 2 to 3 simple sentences. Keep your explanation extremely clear, educational, and direct. Avoid jargon.<|im_end|>
<|im_start|>user
${userText}<|im_end|>
<|im_start|>assistant
`;

        // Send generation task to the background thread
        worker.postMessage({ type: 'generate', prompt });
    }

    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        appendMessage(text, "student");
        chatInput.value = "";
        
        handleResponse(text);
    }

    // Event Listeners
    chatSend.addEventListener("click", sendMessage);
    
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });

    quickPrompts.forEach(btn => {
        btn.addEventListener("click", () => {
            const query = btn.getAttribute("data-query");
            if (worker && query) {
                appendMessage(query, "student");
                handleResponse(query);
            }
        });
    });

    // Only initialize the model when the user clicks the AI Tutor tab
    const aiTutorTab = document.querySelector('li[data-target="ai-tutor"]');
    if (aiTutorTab) {
        aiTutorTab.addEventListener("click", () => {
            if (!worker) {
                initModel();
            }
        });
    }
});
