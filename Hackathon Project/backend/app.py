from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import anthropic
import os, json
from datetime import date, datetime, timezone
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

    result = json.loads(clean)

    #Save food scan
    #scan_response = supabase.table("food_scans").insert({
        #"food_name": result["food_name"],
        #"calories": result["calories_per_serving"],
        #"protein": result["macros"]["protein_g"],
        #"carbs": result["macros"]["carbs_g"],
        #"fat": result["macros"]["fat_g"]
    #}).execute()

    #Get scan_id
    #scan_id = scan_response.data[0]["id"]
    #result["scan_id"] = scan_id

    return jsonify(result)

@app.route("/from-ingredients", methods=["POST"])
def from_ingredients():
    image_b64 = request.json.get("image")
    if not image_b64:
        return jsonify({"error": "no_image"})

    prompt = """Look at this image. If it does not contain food ingredients, respond with exactly:
{"error": "not_ingredients"}

If it does contain ingredients, identify them all and respond with ONLY valid JSON, no extra text:
{
  "ingredients_detected": ["ingredient 1", "ingredient 2"],
  "dishes": [
    {
      "name": "Dish name",
      "uses_ingredients": ["ingredient 1", "ingredient 2"],
      "missing_ingredients": ["optional extras you'd need"],
      "difficulty": "easy",
      "time_minutes": 20,
      "cost_gbp": 2.50,
      "nutrition": {
        "calories_per_serving": 450,
        "protein_g": 22,
        "carbs_g": 40,
        "fat_g": 14,
        "fibre_g": 5,
        "health_score": 7
      },
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

health_score is 1–10 (10 = extremely nutritious). Return 3 dishes ranked by how well they use the available ingredients."""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
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
    try:
        response = supabase.auth.sign_up({
            "email": data["email"],
            "password": data["password"]
        })
        return jsonify(response.user.model_dump())
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data["email"],
            "password": data["password"]
        })
        return jsonify({
            "access_token": response.session.access_token,
            "user": response.user.model_dump()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

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

@app.route("/log-meal", methods=["POST"])
def log_meal():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401

    user_response = supabase.auth.get_user(token)
    if not user_response or not user_response.user:
        return jsonify({"error": "Invalid token"}), 401

    data = request.json
    meal = {
        "user_id": user_response.user.id,
        "food_name": data.get("food_name", ""),
        "calories": data.get("calories", 0),
        "protein_g": data.get("protein_g", 0),
        "carbs_g": data.get("carbs_g", 0),
        "fat_g": data.get("fat_g", 0),
        "cost": data.get("cost", 0),
        "logged_at": data.get("timestamp", datetime.now(timezone.utc).isoformat()),
    }

    result = supabase.table("meals").insert(meal).execute()
    return jsonify(result.data[0] if result.data else meal)


@app.route("/get-meals", methods=["GET"])
def get_meals():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401

    user_response = supabase.auth.get_user(token)
    if not user_response or not user_response.user:
        return jsonify({"error": "Invalid token"}), 401

    today = date.today().isoformat()
    result = supabase.table("meals").select("*") \
        .eq("user_id", user_response.user.id) \
        .gte("logged_at", today) \
        .order("logged_at") \
        .execute()
    return jsonify(result.data)


@app.route("/delete-meal/<meal_id>", methods=["DELETE"])
def delete_meal(meal_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401

    user_response = supabase.auth.get_user(token)
    if not user_response or not user_response.user:
        return jsonify({"error": "Invalid token"}), 401

    supabase.table("meals").delete() \
        .eq("id", meal_id) \
        .eq("user_id", user_response.user.id) \
        .execute()
    return jsonify({"ok": True})


#AI nutrition coach route
@app.route("/nutrition-coach", methods=["POST"])
def nutrition_coach():

    data = request.get_json()

    #Most likely retrieve from database (change)
    user_profile = data.get("user_profile")
    #recipe result
    food_data = data.get("food_data")
    #scan_id 
    scan_id = data.get("scan_id")
    
        
    if not user_profile or not food_data:
        return jsonify({"error": "missing_data"}), 400
    
    advice = get_nutrition_advice(user_profile, food_data)

    #Save nutrition coach data to database
    #supabase.table("nutrition_advice").insert({
        #"scan_id": scan_id,
        #"health_score": advice["health_score"],
        #"summary": advice["summary"],
        #"good_points": advice["good_points"],
        #"improvements": advice["improvements"],
        #"next_meal_suggestion": advice["next_meal_suggestion"]
    #}).execute()

    return jsonify(advice)

@app.route("/save-meal", methods=["POST"])
def save_scan():
    try:
        data = request.json

        #insert food scan
        scan = supabase.table("food_scans").insert({
            "food_name": data["food_name"],
            "calories": data["calories"],
            "protein": data["protein_g"],
            "carbs": data["carbs_g"],
            "fat": data["fat_g"],
            "cost": data["cost_per_serving_gbp"],
        }).execute()

        scan_id = scan.data[0]["id"]

        #insert AI coach result
        supabase.table("nutrition_advice").insert({
            "scan_id": scan_id,
            "health_score": data["advice"]["health_score"],
            "summary": data["advice"]["summary"],
            "good_points": data["advice"]["good_points"],
            "improvements": data["advice"]["improvements"],
            "next_meal_suggestion": data["advice"]["next_meal_suggestion"]
        }).execute()

        return jsonify({"success": True})
    
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000) 