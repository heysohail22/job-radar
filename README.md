# ✨ Agentic AI Resume Workspace & Live AI Tailor

A modern, high-performance **Agentic AI Resume Builder & Real-Time Job Tailoring Workspace**. Built with React 19, Vite, TailwindCSS, and integrated with **Groq LPUs** (`gpt-oss-120b`, `llama-3.3-70b`) and **Google Gemini** for instant ATS resume optimization.

---

## 🚀 Features

- 🧠 **Groq & Gemini AI Resume Tailoring:** Paste any target Job Description (JD) to automatically align summary, technical skills, and project bullet points with a target 95%+ ATS Keyword Match Rate.
- ⚡ **Supported AI Models:**
  - `openai/gpt-oss-120b` (Groq 120B Open Source)
  - `openai/gpt-oss-20b` (Groq 20B Open Source)
  - `llama-3.3-70b-versatile` (Meta Llama 3.3 70B)
  - `qwen/qwen3.6-27b` (Alibaba Qwen 27B)
  - `gemini-2.5-flash` (Google Gemini 2.5 Flash)
  - `gemini-3.5-flash-lite` (Google Gemini 3.5 Flash Lite)
- 🖨️ **Strict 1-Page PDF Export Engine:** Enforces print media CSS rules to guarantee zero overflow to page 2 and zero white gaps.
- 🎛️ **Precision Spacing Stepper Controls:** Fine-tune `Font Size`, `Line Height`, `Section Gap`, and `Page Padding` using `[−]` / `[＋]` buttons or direct numerical inputs.
- 📱 **Mobile Touch-Optimized Layout:** Dual-pane side-by-side workspace on desktop, responsive touch-optimized 2x2 grid controls on mobile screens.

---

## 🔑 Required API Keys Setup

To use the AI tailoring features, set up your environment variables by copying `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 1. Groq API Key (`VITE_GROQ_API_KEY`)
- **Cost:** Free Tier
- **Get Key:** [console.groq.com/keys](https://console.groq.com/keys)
- **Powers:** `openai/gpt-oss-120b`, `llama-3.3-70b-versatile`, `qwen/qwen3.6-27b`

### 2. Google Gemini API Key (`VITE_GEMINI_API_KEY`)
- **Cost:** Free Tier
- **Get Key:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Powers:** `gemini-2.5-flash`, `gemini-3.5-flash-lite`

`.env` format:

```env
VITE_GROQ_API_KEY=gsk_your_groq_key_here
VITE_GEMINI_API_KEY=AIzaSy_your_gemini_key_here
```

---

## 🛠️ Local Development & Mobile Testing

### 1. Install Dependencies
```bash
pnpm install
# or npm install
```

### 2. Run Local Dev Server
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Test on Mobile Phone (Same Wi-Fi Network)
To test on your phone connected to the same Wi-Fi:
```bash
pnpm dev --host
```
Open `http://YOUR_LOCAL_IP:5173` on your mobile browser.

---

## 📦 Build for Production

```bash
pnpm build
```

---

## 📄 License

MIT License. Developed by **Sohail Islam** ([heysohil22](https://github.com/heysohail22)).
