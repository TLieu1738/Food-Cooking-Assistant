import json
from ai_client import client

def get_nutrition_advice(user_profile, food_data):
    """
    Generates personalised nutrition advice using AI
    """

    prompt = f"""You are an expert AI nutrition coach giving personalised advice.

User profile:
{json.dumps(user_profile)}

Food eaten:
{json.dumps(food_data)}

Respond with ONLY valid JSON, no markdown or code fences:

{{
    "summary": "short feedback",
    "health_score": 7,
    "good_points": ["point 1", "point 2"],
    "improvements": ["point 1", "point 2"],
    "next_meal_suggestion": "suggestion here"
}}
"""
    try:
        response = client.messages.create(   # fix: was client.message.create
            model="claude-haiku-4-5-20251001",  # fix: valid model name, fast & cheap for this task
            max_tokens=600,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )

        text = response.content[0].text.strip()
        # Strip any accidental markdown fences
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        clean = text.strip()

        return json.loads(clean)

    except Exception as e:
        print(f"Nutrition coach error: {e}")
        return {"error": str(e)}

