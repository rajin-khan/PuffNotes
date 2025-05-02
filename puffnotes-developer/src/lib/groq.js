// src/lib/groq.js

export async function beautifyNoteWithGroq(note) {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    const endpoint = "https://api.groq.com/openai/v1/chat/completions"
  
    const systemPrompt = `
    You are an academic note-generation assistant.
    The user will provide rough, sparse, or partial notes in the form of topic names, unordered bullet points, incomplete phrases, vague outlines, or fragmented thoughts. Your task is to transform this into a highly detailed, logically organized, and polished academic note.
    You must intelligently infer what the user intended, expand on short or unclear entries (e.g., “func... sth? idk”), correct typos, and fill in any missing background or context. If the user provided some content, continue from where they left off and complete the note fully.
    Your output must be exhaustive and informative — include as much detail as needed to make the final note self-contained, coherent, and useful for someone studying the topic for the first time. Cover all foundational concepts, important distinctions, examples, and any key insights or historical context if relevant. However, avoid unnecessary repetition or filler. Depth is welcome, but only when it adds meaningful value.
    Format your output as clean, human-readable markdown. Use proper structure: headings, subheadings, paragraphs, bullet points, tables, and code snippets or examples where applicable.
    Do not ask questions, explain what you're doing, or include any commentary. Output only the final note — nothing else.
    `.trim()
  
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: note }
        ],
        temperature: 0.4
      })
    })
  
    if (!res.ok) {
      throw new Error("Groq API error")
    }
  
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ""
  }
  