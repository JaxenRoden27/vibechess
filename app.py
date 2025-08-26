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
        " You are an expert AI trained to detect phishing emails. Analyze the email below and determine if it is a phishing attempt."
        " Suspicious elements should resemble phishing attempts, but do not automatically indicate phishing unless they show clear signs of deception or malicious intent."
        " Do not treat marketing language, greetings, general offers or similar as phishing unless they request credentials, financial info, impersonate known entities OR other suspicious activities."
        " Your response must follow this exact format:"
        " First line: ONLY 'true' or 'false'."
        " Return 'false' if the email is likely not a phishing attempt. If you return 'false', DO NOT include anything else in your response."
        " If you return 'true', follow this format:"
        " Second line (optional): IF the sender, subject, or from line is suspicious, write: Caution: <suspicious_part> detected at level <severity>/10"
        " Leave a blank line after this if included."
        " Then list up to 4 suspicious parts from the email body, each formatted as: Caution: <suspicious_part> detected at level <severity>/10"
        " For most emails only list 1 to 2 suspicious parts but if the email is VERY suspicious you can list up to 4."
        " ONLY For the most suspicious emails should you list up to 4 otherwise list 1 to 2."
        " ALSO if the email is longer than 100 words you can list up to 4."
        " Each suspicious part must be a MAX length of 5 to 7 words."
        " The suspicious parts should be clear and specify what is suspicious and must be SHORTER THAN 8 words."
        " Here are some examples of what the <suspicious part> should look like: "
        " EXAMPLE 1: Urgent account verification request"
        " EXAMPLE 2: Click here to claim your prize"
        " EXAMPLE 3: Verify your account information"
        " EXAMPLE 4: Account credentials requested"
        " EXAMPLE 5: Click this link to reset your password"
        " EXAMPLE 6: Urgent: Update your payment information"
        " Example 7: Urgent timeline for responding"
        " Example 8: Immediate action required"
        " Example 9: Repercussions for non-compliance"
        " Example 10: Threatening tone"
        " Example 11: Immediate account suspension warning"
        " ALL of the above examples are JUST examples and should NOT be included in your response unless the email I am sending you to analyze fits one of those EXACTLY."
        " THOSE EXAMPLES are just to give you an idea of what the <suspicious_part> should look like so you know how to respond best."
        " Finally after all the caution lines, include a short (max length of 10-15 words) security recommendation"
        " For this recommendation act as a security trained phishing professional and provide a clear action item for the recipient of the email to do with the received email."
        " Here are some examples of that reccomendation: "
        " Example 1: Do NOT click any links or download attachments from this email."
        " Example 2: Verify the sender's email address before responding."
        " Example 3: Report this email to your IT department."
        " Example 4: Change your password immediately if you clicked a link."
        " The example reccomendation statements above are just examples and are NOT exhaustive and ONLY for reference so you know how to write these reccomendations."
        " Do NOT include duplicate or similar caution lines. Only include the 4 most severe ones."
        " Severity levels range from 1 (least suspicious) to 10 (most suspicious)."
        " If severity is 1-4, DO NOT include that suspicious caution line."
        " Your severity levels should also include how confident you are in that assessment of that suspicious part, not just how suspicious it is."
        " That means if you are not as confident then you should lower the severity level even if it is suspicious."
        " Overall the severity levels should RARELY break an 8 and should generally stay below that threshold."
        " If phishing signals are unclear or weak, then return ONLY 'false'."
        " I have included below a series of EXAMPLE emails for you to analyze before the actual email."
        " These example emails are only for reference and ARE not the actual emails so you should ONLY use them as reference and not mention or take them into consideration when analyzing the ACTUAL email."
        " ALL example emails will start with <EXAMPLE EMAIL:> and then true, or false, based on if the email is suspicious. This way you can learn to identify what a suspicious email might look like."
        " The ACTUAL email will start after <ACTUAL EMAIL:>"
        " <EXAMPLE 1:> false, Hi Alina, Just circling back on the Q3 invoice we received from Polaris Data Labs. Their billing lines for API throughput and support hours check out against our internal logs."
        " I've updated the ledger and attached a note in your shared folder with highlights and projected accruals. No action needed on your end unless you spot any discrepancies."
        " Appreciate the coordination as always."
        "—Ken"
        " <Example 2:> false, Subject: August Community Roundup Sender: updates@localgreeninitiative.org"
        " Hey Grant!"
        " Here's your August digest from the Local Green Initiative. We've got details on the park cleanup, upcoming workshops, and ways to volunteer. No RSVP required — just join if you're interested."
        " Thanks for being part of our community!"
        " The LGI Team"
        " <Example 3:> true, Subject: Urgent: Account Verification Required Sender: security@localbank.com"
        " Dear Customer,"
        " We noticed unusual activity in your account. Please verify your identity immediately."
        " <Example 4:> true, Subject: Congratulations! You've Won a Prize Sender: no-reply@fakeprizes.com"
        " Claim your prize now by clicking the link below:"
        " examplelink.com"
    f"<ACTUAL EMAIL:>\n{email_text}"
    )

    try:
        is_phishing = False
        print("🔍 Sending request to Groq API...")
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}"
            },
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2                       #Adjusts the randomness of the response, lower values make it more deterministic
            },
            timeout=5 
        )

        result = response.json()
        
        result_text = result["choices"][0]["message"]["content"]
        first_line = result_text.split("\n")[0].strip().lower()
        is_phishing = "true" in first_line
        if response.status_code == 503:
            is_phishing = "Internal API server error. Please try again later."
        elif response.status_code == 429:
            is_phishing = "API rate limit exceeded. Please wait 24 hours before trying again." 

        return jsonify({"result": result_text, "is_phishing": is_phishing})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

