<div align="center">

# PrivGuardWeb
**A zero-trust, 100% local privacy risk and PII scanner for social media content.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react)](#)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab.svg?logo=python)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi)](#)

</div>

PrivGuardWeb is a powerful, locally-hosted privacy protection tool that analyzes text and images before you upload them to social media. By running entirely on your machine, it guarantees that your sensitive data never touches a third-party server. 

## 🚀 Key Features

* **100% Local Image & Text Scanning:** Complete air-gapped processing resulting in zero data retention. Your payloads never leave your hardware.
* **Biometric & Face Detection:** Native facial bounding utilizing offline robust OpenCV Haar Cascades limits accidental biometric leaks.
* **Image Text Extraction & NLP:** Integrates locally-installed instance of EasyOCR directly bound to Microsoft Presidio Analyzer Engine natively picking out highly-sensitive contexts.
* **Client-side Encrypted Gallery Storage:** Secures indexed content locally preventing any data exposure outside boundaries.

## 🏗️ Architecture Overview

PrivGuard relies on a **Dual-Stack Architecture** explicitly designed for maximum privacy constraints:
1. **Frontend (React/Vite):** A robust client-side dashboard that encrypts items and synchronously routes data payloads smoothly internally.
2. **Backend (Python FastAPI):** A stateless machine learning server actively running on `http://localhost:8000`. 
   
The frontend pushes textual bytes and image buffers purely directly into the FastAPI endpoint running natively. By completely detaching from Anthropic (Claude) or other external AI infrastructure, PrivGuard relies strictly on local computational boundaries flawlessly preventing third-party snooping.

## 🛠️ Prerequisites

Before installing, ensure your environment structurally provides:
- [Node.js](https://nodejs.org/en) (v18+)
- Python 3.11 or greater
- Git

## 💻 Quick Start & Installation

Because the architecture inherently isolates components completely securely, there are absolutely **no `.env` API keys required!** It operates dynamically air-gapped straight away!

### Phase 1: Backend Setup
Open a terminal instance natively to configure the underlying Machine Learning Pipeline bindings:
```bash
# Enter the backend directory
cd backend

# Create and activate a pristine Python virtual environment natively
python -m venv venv
# Windows: venv\\Scripts\\activate
# Mac/Linux: source venv/bin/activate

# Install the structural payload constraints and models
pip install -r requirements.txt

# Download the English Natural Language Processing spacy mappings
python -m spacy download en_core_web_sm

# Spin up the endpoint locally natively on port 8000
uvicorn main:app --reload
```

### Phase 2: Frontend Setup
Open an independent secondary terminal instance for configuring the dashboard securely natively:
```bash
# Return to the active frontend root natively logically
cd ..

# Fetch dependencies
npm install

# Instanciate the React Dashboard cleanly
npm run dev
```
Navigate your browser directly to `http://localhost:5173` to test the dashboard cleanly seamlessly!

## 🧪 Testing Suite

PrivGuard utilizes a thorough dual-layered automated testing pipeline.

**To run the React (Vitest + Testing Library) mappings cleanly:**
```bash
npx vitest
```

**To comprehensively test the Air-Gapped Python Endpoints natively:**
```bash
cd backend
pytest tests/
```

---

### Authors & Credits
Developed by **Taanush Emmanuel Abraham** and **[Tanishka Kundu](https://github.com/thetan-dev)**.
