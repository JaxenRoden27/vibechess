import os
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"])

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    boardData = data.get("boardData", "")
    moveHistory = data.get("moveHistory", [])
    
    seed = random.randint(1000, 9999)
    prompt = (
        "On a scale of 1 to 10, 10 being the best player in the world and 1 being someone who has minimal knowledge about chess, you are a 4. " +
        "You are always going to be the black pieces in the game. You will move one piece at a time. " +
        "You must only move a black piece, never a white piece. " +
        f"The current state of the board is: {boardData} " +
        f"The move history of the game so far is: {moveHistory} " +
        "Based on the current state of the board, suggest a move for black that a beginner chess player might make in the same situation. " +
        "Beginners do not always make the exact same move, so you should introduce variety in your choices. " +
        "From all valid black beginner moves, pick one at random as if different beginners were making the decision. " +
        "Make sure that even though this is a beginner move, it is still a valid move according to chess rules. " +
        "Do not always choose the same move in the same situation. " +
        "Respond in the following format: COLUMNROW, COLUMNROW. " +
        "The first COLUMNROW is the black piece you are moving, the second COLUMNROW is the location on the board you are moving the black piece to. " +
        "Make sure you respond with exactly the format specified, making sure to include the comma and space between the COLUMNROW and the COLUMNROW. " +
        "Here are some example responses, this is only for you to learn from the formatting not the moves themselves: Example 1: E7, E5. Example 2: D7, D5. Example 3: C6, C5. Example 4: B7, C5. " +
        "Abide by all basic chess rules and remember you are always going to be black. " +
        "Only include the move in the specified chess notation, no additional text. " +
        "Randomizer: {seed}"
    )

    try:
        print("🔍 Sending request to Groq API...")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('chessbroskey')}"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 1.3,
                "top_p": 0.8,
            },
            timeout=5 
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



