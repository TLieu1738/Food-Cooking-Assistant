from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import anthropic
import os, json
from dotenv import load_dotenv
from coach import get_nutrition_advice
from dbClient import supabase

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

app = Flask(__name__)
CORS(app)


@app.after_request
def add_ngrok_header(response):
    response.headers['ngrok-skip-browser-warning'] = 'true'
    return response

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')

#@app.route("/")
#def serve_frontend():
 #   return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route("/recipes", methods=["POST"])
def get_recipes():
    image_b64 = request.json.get("image")
    if not image_b64:
        return jsonify({"error": "no_image"})

    prompt = """Look at this image. If it does not contain food or drink, respond with exactly:
{"error": "not_food"}

If it does contain food or drink, identify what it is and respond with ONLY valid JSON, no extra text:
{
  "food_name": "name of the food",
  "ingredients": "list of ingredients",
  "calories_per_serving": 400,
  "cost_per_serving_gbp": 2.50,
  "macros": {"protein_g": 20, "carbs_g": 45, "fat_g": 12},
  "recipes": [
    {
      "name": "Quick version",
      "difficulty": "easy",
      "time_minutes": 15,
      "cost_gbp": 1.80,
      "steps": ["Step 1", "Step 2", "Step 3"]
    },
    {
      "name": "Proper version",
      "difficulty": "medium",
      "time_minutes": 35,
      "cost_gbp": 3.20,
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}"""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": image_b64
                    }
                },
                {"type": "text", "text": prompt}
            ]
        }]
    )
    clean = response.content[0].text.strip().strip("```json").strip("```").strip()
    return jsonify(json.loads(clean))

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json

    response = supabase.auth.sign_up({
        "email": data["email"],
        "password": data["password"]
    })

    return jsonify(response.user.model_dump())

@app.route("/login", methods=["POST"])
def login():
    data = request.json

    response = supabase.auth.sign_in_with_password({
        "email": data["email"],
        "password": data["password"]
    })

    return jsonify({
        "access_token": response.session.access_token,
        "user": response.user.model_dump()
    })

@app.route("/protected", methods=["GET"])
def protected():
    token = request.headers.get("Authorization")

    if not token:
        return {"error": "No token"}, 401

    token = token.replace("Bearer ", "")

    user = supabase.auth.get_user(token)

    if not user:
        return {"error": "Invalid token"}, 401

    return {"message": "You are logged in!"}

#AI nutrition coach route
@app.route("/nutrition-coach", methods=["POST"])
def nutrition_coach():

    data = request.get_json()

    #Most likely retrieve from database (change)
    user_profile = data.get("user_profile")
    #recipe result
    food_data = data.get("food_data")
    
        
    if not user_profile or not food_data:
        return jsonify({"error": "missing_data"}), 400

    advice = get_nutrition_advice(user_profile, food_data)
    return jsonify(advice)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000) 