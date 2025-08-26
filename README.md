🛡️ Gmail Phishing Checker Extension

A lightweight Google Chrome extension that protects users from suspicious emails directly inside Gmail — giving real-time insight into potential phishing risks using AI.

📦 Installation
- Download the extension .zip file or clone this repo
- Go to chrome://extensions in your browser
- Enable "Developer Mode" in the top right corner
- Click "Load unpacked" in the top left corner and select the project folder
- You're good to go! Open an email in Gmail and click the extension's button to run

✨ Highlights
- 🔍 Scans emails with Groq LLM for phishing patterns in real time
- 🧠 Smart logic filters out false positives using severity scores
- 📬 Injects caution banners seamlessly above the email's body
- 🎨 Features 6 unique background themes for the "Scan" button
- 🛡️ Focused on user security and zero data retention

❓ How Does It Work? 
This extension intercepts Gmail emails in the DOM and sends the full body content, including the sender and subject, to an AI-powered phishing detection backend powered by Groq’s LLM. The backend returns either true or false, along with a list of suspicious elements if phishing is detected.
If phishing is detected:
- A caution banner is inserted at the top of the email
- Caution lines highlight the most critical suspicious indicators
- All decisions are made based on a precise scoring model inside the prompt

🔐 User Data & Security: 
This extension is designed with security and privacy at its core. Here's how your data is handled:
- 🚫 No data storage: Emails are never saved, logged, or stored by the extension or its backend
- 📡 Secure transmission: All communication with the Groq LLM backend is encrypted using HTTPS
- 🎯 Email analysis is local to Gmail context: Only the content of the currently viewed email is processed
- 🕵️ No personal information is extracted: The extension analyzes only email text for suspicious patterns
- ✅ No permissions beyond Gmail DOM access: The extension does not request broad data permissions
- 🔘 Email content is ONLY read into the backend once you click on the “Scan” button

🎨 Customize with the Options Page:
Every time you detect a phishing email, you earn a single Scamite — a small reward for keeping your inbox safe. You can spend these Scamites on the Options page, where you’ll find six unique background themes.
To access the Options page:
- Right-click the extension icon in your Chrome toolbar
- Select “Options”

⚠️ Disclaimer (Server Response Time):
This project is hosted on a free-tier web server, which includes automatic resource management to conserve usage. This can result in:
- 🕒 Cold Start Delay: The first request made to the server after a period of inactivity may take up to 1 minute to receive a response. This is because the server needs to spin up from a dormant state.
- ⏳ Idle Timeout: After the server becomes active, it remains responsive for 15 minutes. If no further requests are made during that time, the server will spin down again into a dormant state.
This behavior is expected and helps keep hosting costs low. For best performance during testing or demos, consider sending a preliminary request to "wake" the server.

📮 Contact & Security Reporting
If you discover any vulnerabilities, accuracy concerns, or have suggestions to improve this application, please reach out directly at grantklein528@gmail.com
