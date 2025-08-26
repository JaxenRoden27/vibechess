import os
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)  

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    email_text = data.get("email", "")

    prompt = (
        "You are a chess player. You will respond only with your move. "
    f"\n{email_text}"
    )

    try:
        is_phishing = False
        print("🔍 Sending request to Groq API...")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('chessbroskey')}"
            },
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2                       #Adjusts the randomness of the response, lower values make it more deterministic
            },
            timeout=10 
        )

        result = response.json()
        
        result_text = result["choices"][0]["message"]["content"]
        first_line = result_text.split("\n")[0].strip().lower()
        
        if response.status_code == 503:
            is_phishing = "Internal API server error. Please try again later."
        elif response.status_code == 429:
            is_phishing = "API rate limit exceeded. Please wait 24 hours before trying again." 

        return jsonify({"result": result_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


