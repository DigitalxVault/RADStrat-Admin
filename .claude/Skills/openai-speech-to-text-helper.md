---
name: openai-speech-to-text-helper
description: Help users implement, debug, and improve OpenAI speech-to-text (audio transcription).
version: 1.0.0
dependencies: []
---

# OpenAI Speech-to-Text Implementation Helper

## Purpose  

This Skill helps the assistant guide users through **implementing and troubleshooting OpenAI’s speech-to-text features**.  
It covers:

- One-off file transcription (e.g., MP3, WAV) using the `audio.transcriptions` and `audio.translations` APIs.
- Choosing models (e.g., `gpt-4o-mini-transcribe`, `gpt-4o-transcribe`, `whisper-1`).
- Basics of realtime transcription with the Realtime API.
- Debugging common errors (bad file formats, auth issues, request errors).

Success = the user leaves with a **working example** (or clear next debug step) in their language/framework of choice, and they understand the key pieces (endpoint, model, parameters, file handling).

---

## When to Use This Skill  

Trigger this Skill when the user:

- Asks how to **transcribe audio to text** using OpenAI (e.g. “How do I use Whisper / gpt-4o transcribe in Python/Node/JS?”).
- Shares audio-related code using OpenAI and gets errors (`/v1/audio/transcriptions`, `client.audio.transcriptions.create`, etc.).
- Wants to **convert voice notes, lectures, meetings** into text.
- Asks about **realtime or streaming transcription** using OpenAI.

Do **not** use this Skill when:

- The question is about **text-to-speech** only (generating audio from text) without transcription.
- The user wants **general theory of speech recognition** or non-OpenAI providers.
- The user is asking for **illegal / unethical use** of audio (e.g. secretly recording someone, bypassing consent).

---

## Inputs  

Typical inputs:

- Natural language questions, e.g.:
  - “How do I transcribe an mp3 file with OpenAI in Python?”
  - “Here’s my Node code, why is my transcription result empty?”
  - “I need realtime transcription from microphone.”
- Code snippets showing:
  - Python: `from openai import OpenAI` / `client = OpenAI()`
  - JS/TS: `import OpenAI from "openai"; const client = new OpenAI();`
  - Raw HTTP/curl requests to `/v1/audio/transcriptions` or Realtime endpoints.
- Error messages (HTTP status codes, stack traces).

Assumptions:

- The user already has (or can obtain) an OpenAI API key.
- Audio input is one of the supported types (mp3, mp4, mpeg, mpga, m4a, wav, webm), or the Skill will suggest converting to a supported format.
- For realtime use, the user is okay using WebSocket/WebRTC examples or a server-side script.

---

## Outputs  

The Skill should output:

- **Step-by-step guidance** explaining:
  - Which endpoint/model to use.
  - How to structure the request.
  - How to handle files.
- **Minimal working code examples**, tailored to the user’s:
  - Language (Python, JS/TS/Node, or curl/HTTP).
  - Use case (file transcription, translation, realtime).
- **Debugging advice**:
  - What the error means.
  - How to fix it (configuration, file, parameters, etc.).
- Optional **best-practices notes**, like:
  - Good model choice for accuracy vs cost.
  - Recommended response formats.
  - Handling long recordings.

All answers should be structured with clear headings and code blocks, for example:

- Short explanation
- Code snippet(s)
- Notes / Gotchas
- Optional next steps

---

## Behaviour & Step-by-Step Process  

When this Skill is active, follow this algorithm:

1. **Identify the user’s goal and environment**

   - Determine:
     - Are they transcribing a **finished file** or doing **realtime** transcription?
     - Do they want **same-language transcript** (transcription) or **English translation**?
     - What language/framework are they using (Python, JS/Node, curl, other)?
   - If any of these are unclear, briefly infer from context; if still ambiguous, choose **Python** as the default language and clearly label it so the user can ask for another language.

2. **Choose the right API and model**

   - For **file transcription**:
     - Use `/v1/audio/transcriptions`.
     - Default to a modern speech-to-text model such as `"gpt-4o-mini-transcribe"` (for accuracy and speed) or `"gpt-4o-transcribe"` (for higher-quality), and mention `"whisper-1"` as a simpler/legacy option.
   - For **audio translation to English**:
     - Use `/v1/audio/translations` with the same family of models.
   - For **realtime transcription**:
     - Use the Realtime API in **transcription mode** (no responses, only transcripts), or speech-to-speech conversation mode if they want both transcription + replies.

   Explain clearly *why* you chose a model/end-point (e.g. better accuracy, supports diarization, etc., when relevant).

3. **Outline the request structure before showing code**

   Verbally describe the key pieces:

   - Endpoint:
     - e.g. `POST /v1/audio/transcriptions` for regular file transcription.
   - Required params (typical):
     - `file`: the audio file (binary) in a supported format.
     - `model`: the chosen transcription model (e.g. `"gpt-4o-mini-transcribe"`).
   - Common optional params:
     - `response_format` (e.g. `json`, `text`, `srt`, `verbose_json`, or diarization formats when supported by the chosen model).
     - `prompt` (to bias the transcription toward certain terms).
     - `temperature` (rarely needed; default is usually fine).

4. **Generate a minimal working example**

   Based on their language:

   - **Python** (using the official `openai` client):
     - Show `from openai import OpenAI; client = OpenAI()`.
     - Demonstrate opening a local file in binary mode and calling `client.audio.transcriptions.create(...)`.
     - Include a small script that prints `transcription.text` or the returned JSON.
   - **JavaScript/Node**:
     - Show `import OpenAI from "openai"; const client = new OpenAI();`.
     - Use `client.audio.transcriptions.create({ file: fs.createReadStream("..."), model: "gpt-4o-mini-transcribe" })`.
   - **curl/HTTP**:
     - Show `curl` with `-F "file=@audio.mp3"` and `-F "model=gpt-4o-mini-transcribe"`.

   For each snippet:

   - Add short comments explaining each line.
   - Assume the API key is provided by environment variables or config; don’t hard-code example secrets.

5. **Handle audio format and size considerations**

   - Remind the user:
     - Supported input formats include common types like mp3, mp4, mpeg, mpga, m4a, wav, and webm.
     - There is a size limit per uploaded file; if their file is very large, suggest splitting it or compressing it (lossless/controlled).
   - If the user’s file type is unsupported, propose a simple conversion command (e.g. using `ffmpeg`) in a generic way, without assuming a specific OS unless they say so.

6. **Offer options for response format and post-processing**

   - Suggest a `response_format` that matches their needs:
     - Plain text: simpler if they just want raw transcript.
     - JSON or verbose JSON: better if they will parse timestamps/segments.
     - SRT/VTT: good for subtitles (if supported by the model they’re using).
     - Diarization formats (e.g. diarized JSON) if they need “who spoke when” and are using a model that supports it.
   - If they mention downstream processing (e.g. summarize the transcript, extract action items):
     - Briefly outline how they can **chain** the transcript into a text model call.

7. **If the user is asking for realtime transcription**

   - Explain the concept:
     - Create a **realtime transcription session** using the Realtime API.
     - Connect with WebSocket or WebRTC (depending on their stack).
     - Send audio chunks and listen for transcription events.
   - Provide a **high-level example** (pseudo-code or simplified JS/Python) showing:
     - Session creation.
     - Microphone/file audio streaming to the session.
     - Handling incoming “transcript delta” or “transcript completed” events.
   - Emphasize latency vs accuracy trade-offs and that they should start with provided SDK examples when possible.

8. **Debugging & error-handling checklist**

   If the user has an error, follow this checklist and adapt it to their code:

   - **401 / auth errors**:
     - Check the API key is set correctly and not empty.
     - Make sure they’re using a valid, non-expired key and the correct header (`Authorization: Bearer ...`).
   - **400 / validation errors**:
     - Verify the `model` name is correct and available.
     - Ensure the `file` is actually being sent (not just a path string).
     - Confirm the file format and size are allowed.
     - Check that optional parameters are valid (correct spelling and types).
   - **Network/timeout errors**:
     - Suggest retry with smaller files or stable networks.
     - Recommend logging the full error and any relevant request data (excluding secrets).
   - For each problem, show how to adjust their code, not just explain in words.

9. **Summarise and offer next steps**

   - Repeat the key final code snippet or configuration they should use.
   - Suggest a simple test:
     - E.g., “Try a short 10-second audio test file, confirm it works, then move to your larger file.”
   - Invite them to provide:
     - Error message + code snippet + what they expected vs what they got.

---

## Use of References and Assets  

Currently this Skill does **not** rely on separate `references/` or `assets/` files.

If you (the assistant) notice that a user frequently needs the same kind of template (e.g. a boilerplate Python transcription script with logging), you may suggest the skill author creates:

- `assets/python-transcription-template.md`
- `assets/js-transcription-template.md`

and then update this Skill to reference them explicitly.

---

## Style & Tone Guidelines  

When using this Skill:

- Be **clear, concise, and beginner-friendly**, but don’t oversimplify technical details.
- Prefer **step-by-step explanations** with small, focused code samples.
- Use:
  - Headings for structure.
  - Bullet lists for options/parameters.
  - Code blocks with comments.
- Never:
  - Include or request the user’s real API keys or secrets.
  - Encourage recording or transcribing people without consent.
- If something is advanced (e.g. WebRTC setup, complex streaming pipelines), say so and suggest starting from official examples or simpler file-based transcription first.

---

## Examples  

### Example 1 – Basic file transcription in Python  

**User prompt:**  
> I have a 5 minute mp3 file. How do I transcribe it to text using OpenAI in Python?

**Intended behaviour:**

- Detect:
  - Use case: one-off file transcription.
  - Language: Python.
- Choose:
  - Endpoint: `/v1/audio/transcriptions`.
  - Model: e.g. `"gpt-4o-mini-transcribe"` (or similar current default).
- Respond with:
  - Short explanation of what’s happening.
  - A minimal working Python script:
    - Imports `OpenAI`.
    - Creates `client = OpenAI()`.
    - Opens `audio.mp3` in binary mode and passes it as `file`.
    - Prints `transcription.text`.
  - A tip about supported formats and file sizes.
  - A suggestion to test on a small sample file first.

---

### Example 2 – Debugging a Node.js error  

**User prompt:**  
> This is my Node JS code to use Whisper but I keep getting a 400 error. Here’s the code and error message.

**Intended behaviour:**

- Read the provided code and error.
- Identify common issues:
  - Wrong model name, or trying to use a deprecated endpoint.
  - Passing only a path string instead of a stream/Buffer for `file`.
  - Missing or invalid `model` param.
- Explain:
  - What the specific 400 error means.
  - Exactly which line/parameter is wrong.
- Provide:
  - A corrected code snippet with `client.audio.transcriptions.create({ file: fs.createReadStream("..."), model: "gpt-4o-mini-transcribe" })` or similar.
  - A brief checklist:
    - Confirm file exists at that path.
    - Confirm environment variable for API key is set.

---

### Example 3 – Realtime transcription from microphone  

**User prompt:**  
> I want to stream my microphone to OpenAI and get live transcription in my app. How should I set this up?

**Intended behaviour:**

- Recognise this is a **realtime transcription** use case.
- Explain:
  - That they need to create a Realtime API transcription session.
  - How the client connects (WebSocket/WebRTC) and sends audio frames.
  - That they should listen for transcription events (deltas/completions).
- Provide:
  - A high-level JS/TS or Python example (simplified, pseudo-code is okay).
  - A list of steps: set up session → connect microphone → send audio → handle transcript events → close session.
- Mention:
  - Latency vs quality considerations.
  - That they should prototype with short tests and official examples first.

---

## Limitations & Safety  

This Skill must **not**:

- Provide or ask for real API keys, access tokens, or secrets.
- Help users:
  - Record or transcribe conversations without proper consent.
  - Bypass OpenAI’s rate limits, security, or terms of use.
- Claim transcripts are “perfect” or legally reliable; suggest manual review if accuracy is critical.
- Give legal, medical, or compliance advice about how transcripts are used.

If a user request involves clearly unethical or illegal use of recorded audio, politely refuse and explain why, while still being respectful.
