from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import os, json
from datetime import date, datetime, timezone, timedelta
from dotenv import load_dotenv
from coach import get_nutrition_advice
from dbClient import supabase

from dbClient import supabase, supabase_admin

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def get_user_from_token(token):
    try:
        res = supabase.auth.get_user(token)
        return res.user if res else None
    except Exception:
        return None

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
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username:
        return jsonify({"error": "Username is required."}), 400

    # Check username is unique
    existing = supabase.table("profiles").select("id").eq("username", username).execute()
    if existing.data:
        return jsonify({"error": "Username already taken."}), 400

    try:
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": {"display_name": username}}
        })
        user = response.user
    except Exception:
        return jsonify({"error": "Could not create account. That email may already be registered."}), 400

    try:
        supabase.table("profiles").insert({
            "user_id": user.id,
            "username": username,
            "email": email,
        }).execute()
    except Exception:
        if supabase_admin:
            supabase_admin.auth.admin.delete_user(user.id)
        return jsonify({"error": "Could not save username. Please try again."}), 500

    return jsonify({"id": user.id, "username": username})

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "")

    # Resolve username to email if needed
    email = identifier
    if "@" not in identifier:
        result = supabase.table("profiles").select("email").eq("username", identifier).execute()
        if not result.data:
            return jsonify({"error": "Username not found."}), 400
        email = result.data[0]["email"]

    try:
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        # Fetch username for the response
        profile = supabase.table("profiles").select("username").eq("email", email).execute()
        username = profile.data[0]["username"] if profile.data else email.split("@")[0]
        return jsonify({
            "access_token": response.session.access_token,
            "username": username,
            "email": email,
        })
    except Exception:
        return jsonify({"error": "Incorrect password."}), 400

@app.route("/protected", methods=["GET"])
def protected():
    token = request.headers.get("Authorization")

    if not token:
        return {"error": "No token"}, 401

    token = token.replace("Bearer ", "")

    user = get_user_from_token(token)

    if not user:
        return {"error": "Invalid token"}, 401

    return {"message": "You are logged in!"}

@app.route("/save-meal", methods=["POST"])
def save_meal():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401

    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Invalid token"}), 401

    data = request.json
    meal = {
        "user_id": user.id,
        "food_name": data.get("food_name", ""),
        "calories": data.get("calories", 0),
        "protein_g": data.get("protein_g", 0),
        "carbs_g": data.get("carbs_g", 0),
        "fat_g": data.get("fat_g", 0),
        "cost": data.get("cost_gbp", 0),
        "logged_at": datetime.now(timezone.utc).isoformat(),
    }

    supabase.table("meals").insert(meal).execute()
    return jsonify({"success": True})


@app.route("/log-meal", methods=["POST"])
def log_meal():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401

    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Invalid token"}), 401

    data = request.json
    meal = {
        "user_id": user.id,
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

    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Invalid token"}), 401

    today = date.today().isoformat()
    result = supabase.table("meals").select("*") \
        .eq("user_id", user.id) \
        .gte("logged_at", today) \
        .order("logged_at") \
        .execute()
    return jsonify(result.data)


@app.route("/delete-meal/<meal_id>", methods=["DELETE"])
def delete_meal(meal_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401

    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Invalid token"}), 401

    supabase.table("meals").delete() \
        .eq("id", meal_id) \
        .eq("user_id", user.id) \
        .execute()
    return jsonify({"ok": True})


@app.route("/friends/request", methods=["POST"])
def send_friend_request():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    print("TOKEN RECEIVED:", token)
    user = get_user_from_token(token)
    print("USER:", user)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
 
    sender_id = user.id
    data = request.json
    identifier = data.get("email")
 
    if not identifier:
        return jsonify({"error": "email_required"}), 400
 
    # Find receiver by email or username
    receiver = supabase.table("profiles") \
        .select("*") \
        .or_(f"username.eq.{identifier},email.eq.{identifier}") \
        .execute()
 
    if not receiver.data:
        return jsonify({"error": "user_not_found"}), 404
 
    receiver_id = receiver.data[0]["user_id"]
 
    if sender_id == receiver_id:
        return jsonify({"error": "cannot_add_self"}), 400
 
    # Check if already friends
    already_friends = supabase.table("friends") \
        .select("*") \
        .eq("user_id", sender_id) \
        .eq("friend_id", receiver_id) \
        .execute()
 
    if already_friends.data:
        return jsonify({"error": "already_friends"}), 400
 
    # Check if pending request already exists in either direction
    existing = supabase.table("friend_requests") \
        .select("*") \
        .eq("status", "pending") \
        .or_(
            f"and(sender_id.eq.{sender_id},receiver_id.eq.{receiver_id}),"
            f"and(sender_id.eq.{receiver_id},receiver_id.eq.{sender_id})"
        ) \
        .execute()
 
    if existing.data:
        return jsonify({"error": "request_already_exists"}), 400
 
    supabase.table("friend_requests").insert({
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "status": "pending"
    }).execute()
 
    return jsonify({"success": True}), 201
 
 
@app.route("/friends/accept", methods=["POST"])
def accept_friend_request():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
 
    current_user_id = user.id
    data = request.json
    request_id = data.get("request_id")
 
    if not request_id:
        return jsonify({"error": "request_id_required"}), 400
 
    request_data = supabase.table("friend_requests") \
        .select("*") \
        .eq("id", request_id) \
        .execute()
 
    if not request_data.data:
        return jsonify({"error": "not_found"}), 404
 
    req = request_data.data[0]
 
    # Make sure the current user is the receiver
    if req["receiver_id"] != current_user_id:
        return jsonify({"error": "unauthorized"}), 403
 
    if req["status"] != "pending":
        return jsonify({"error": "request_not_pending"}), 400
 
    supabase.table("friend_requests") \
        .update({"status": "accepted"}) \
        .eq("id", request_id) \
        .execute()
 
    # Insert friendship both ways
    supabase.table("friends").insert([
        {"user_id": req["sender_id"], "friend_id": req["receiver_id"]},
        {"user_id": req["receiver_id"], "friend_id": req["sender_id"]}
    ]).execute()
 
    return jsonify({"success": True}), 200

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


@app.route("/goals", methods=["GET"])
def get_goals():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    result = supabase.table("goals").select("*").eq("user_id", user.id).execute()
    if result.data:
        return jsonify(result.data[0])
    return jsonify({"calories": 2000, "protein": 150, "budget": 50})


@app.route("/goals", methods=["POST"])
def save_goals():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    existing = supabase.table("goals").select("id").eq("user_id", user.id).execute()
    if existing.data:
        supabase.table("goals").update({
            "calories": data.get("calories", 2000),
            "protein": data.get("protein", 150),
            "budget": data.get("budget", 50),
        }).eq("user_id", user.id).execute()
    else:
        supabase.table("goals").insert({
            "user_id": user.id,
            "calories": data.get("calories", 2000),
            "protein": data.get("protein", 150),
            "budget": data.get("budget", 50),
        }).execute()

    return jsonify({"success": True})


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "no_messages"}), 400

    # Build meal context for authenticated users
    meal_context = ""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if token:
        try:
            chat_user = get_user_from_token(token)
            if chat_user:
                today = date.today().isoformat()
                result = supabase.table("meals").select("*") \
                    .eq("user_id", chat_user.id) \
                    .gte("logged_at", today) \
                    .order("logged_at") \
                    .execute()
                if result.data:
                    meal_summary = ", ".join([
                        f"{m['food_name']} ({m['calories']} kcal)"
                        for m in result.data
                    ])
                    meal_context = f"\n\nThe user has logged these meals today: {meal_summary}."
        except Exception:
            pass

    system_prompt = f"""You are NutriScan's AI Chef Assistant — a friendly, knowledgeable food and nutrition expert. You help users with:
- Personalised nutrition advice and meal planning
- Recipes and cooking techniques
- Food budget optimisation (prices in GBP)
- Health and dietary goals

Be concise, practical, and conversational. Focus only on food, nutrition, cooking, and health topics.
Do NOT use markdown formatting — no headers, no bold, no bullet symbols like * or #. Use plain sentences and simple line breaks only.{meal_context}"""

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=system_prompt,
        messages=messages
    )

    return jsonify({"reply": response.content[0].text})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)

# Add these routes to your existing app.py

@app.route("/goals", methods=["GET"])
def get_goals():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401
    try:
        user = supabase.auth.get_user(token)
        user_id = user.user.id
        result = supabase.table("goals").select("*").eq("user_id", user_id).single().execute()
        if result.data:
            return jsonify(result.data)
        # No goals set yet — return defaults
        return jsonify({ "calories": 2000, "protein": 150, "budget": 50.00 })
    except Exception as e:
        return jsonify({ "calories": 2000, "protein": 150, "budget": 50.00 })


@app.route("/goals", methods=["POST"])
def save_goals():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401
    try:
        user = supabase.auth.get_user(token)
        user_id = user.user.id
        data = request.json
        payload = {
            "user_id": user_id,
            "calories": int(data.get("calories", 2000)),
            "protein": int(data.get("protein", 150)),
            "budget": float(data.get("budget", 50.00)),
            "updated_at": "now()"
        }
        # Upsert — insert if no row, update if one exists
        result = supabase.table("goals").upsert(payload, on_conflict="user_id").execute()
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Add this route to your existing app.py

@app.route("/meals/week", methods=["GET"])
def get_week_meals():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "No token"}), 401
    try:
        user = supabase.auth.get_user(token)
        user_id = user.user.id

        # Get start of current week (Monday) in UTC
        today = datetime.now(timezone.utc)
        days_since_monday = today.weekday()  # 0 = Monday
        monday = today.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_since_monday)

        result = supabase.table("meals") \
            .select("calories, protein_g, carbs_g, fat_g, cost, logged_at") \
            .eq("user_id", user_id) \
            .gte("logged_at", monday.isoformat()) \
            .order("logged_at") \
            .execute()

        # Group by day of week (0=Mon ... 6=Sun)
        days = {i: {"calories": 0, "protein": 0} for i in range(7)}
        for meal in result.data:
            logged = datetime.fromisoformat(meal["logged_at"].replace("Z", "+00:00"))
            day_index = logged.weekday()  # 0=Mon, 6=Sun
            days[day_index]["calories"] += meal.get("calories") or 0
            days[day_index]["protein"]  += meal.get("protein_g") or 0

        # Format as list Mon–Sun
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        response = [
            {
                "day": day_names[i],
                "calories": round(days[i]["calories"]),
                "protein": round(days[i]["protein"])
            }
            for i in range(7)
        ]
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 400