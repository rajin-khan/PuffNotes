// src/lib/groq.js

// Accept apiKey as an argument
export async function beautifyNoteWithGroq(note, apiKey) {
    // Check if an API key was provided
    if (!apiKey) {
      console.error("Groq API key is missing for beautify request.");
      // Throw a specific error that App.jsx can potentially check
      const error = new Error("API key required for beautification.");
      error.status = 401; // Simulate an unauthorized status
      throw error;
    }
  
    const endpoint = "https://api.groq.com/openai/v1/chat/completions";
  
    const systemPrompt = `
    You are an academic note-generation assistant.
    The user will provide rough, sparse, or partial notes in the form of topic names, unordered bullet points, incomplete phrases, vague outlines, or fragmented thoughts. Your task is to transform this into a highly detailed, logically organized, and polished academic note.
    You must intelligently infer what the user intended, expand on short or unclear entries (e.g., “func... sth? idk”), correct typos, and fill in any missing background or context. If the user provided some content, continue from where they left off and complete the note fully.
    Your output must be exhaustive and informative — include as much detail as needed to make the final note self-contained, coherent, and useful for someone studying the topic for the first time. Cover all foundational concepts, important distinctions, examples, and any key insights or historical context if relevant. However, avoid unnecessary repetition or filler. Depth is welcome, but only when it adds meaningful value.
    Format your output as clean, human-readable markdown. Use proper structure: headings, subheadings, paragraphs, bullet points, tables, and code snippets or examples where applicable.
    Do not ask questions, explain what you're doing, or include any commentary. Output only the final note — nothing else.
    `.trim();
  
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          // Use the provided apiKey here
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-70b-8192", // Updated model example - use your preferred one
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: note }
          ],
          temperature: 0.4 // Keep temperature if desired
        })
      });
    } catch (networkError) {
      console.error("Network error calling Groq API:", networkError);
      throw new Error(`Network error: ${networkError.message}`);
    }
  
    // Check if the response status indicates an error
    if (!response.ok) {
      let errorBody;
      try {
          // Try to parse the error response from Groq for more details
          errorBody = await response.json();
          console.error("Groq API Error Response:", errorBody);
      } catch (parseError) {
          // If parsing fails, use the raw text
          errorBody = await response.text();
          console.error("Groq API Error Response (non-JSON):", errorBody);
      }
      // Create an error object containing status and potentially message from Groq
      const error = new Error(
          errorBody?.error?.message || `Groq API error: ${response.status} ${response.statusText}`
      );
      error.status = response.status; // Attach status code
      error.body = errorBody; // Attach full body if needed for debugging
      throw error;
    }
  
    // Process successful response
    try {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (jsonError) {
      console.error("Error parsing Groq success response:", jsonError);
      throw new Error("Failed to parse successful response from Groq.");
    }
  }