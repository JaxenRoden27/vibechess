import os
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)  

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    player_moves = data.get("player_moves", "")
    most_recent_move = data.get("most_recent_move", "")
    level = data.get("level", 1)

    prompt = (
        "You are a chess player. Your level of play will be determined by the following level of play. 1 is novice and 10 grandmaster. The level of play you will be is: {level}"
        "You are always going to be the black pieces in the game. You will move one piece at a time. The following is all the moves the player has made in the game: {player_moves}"
        "The most recent move made by the player is: {most_recent_move}"
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
        
        if response.status_code == 503:
            is_phishing = "Internal API server error. Please try again later."
        elif response.status_code == 429:
            is_phishing = "API rate limit exceeded. Please wait 24 hours before trying again." 

        return jsonify({"result": result_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


