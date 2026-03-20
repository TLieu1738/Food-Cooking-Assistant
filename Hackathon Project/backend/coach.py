import json
from ai_client import client


#Turn user + meal data into personalized advice
#food_data -> /recipes
#user_profile -> includes things like age, goal, diet
def get_nutrition_advice(user_profile, food_data):
    """
    Generates personalised nutrition advice using AI
    """

    prompt = f"""You are now an expert AI nutrition coach giving the best advice.

User profile:
{json.dumps(user_profile)}

Food eaten:
{json.dumps(food_data)}

Respond with ONLY valid JSON:

{{
    "summary": "short feedback",
    "health_score": 1-10,
    "good_points": ["point"],
    "improvements": ["point"],
    "next_meal_suggestions": "suggestions"
}}
"""
    response = client.message.create(
        model="claude-opus-4-6",
        max_tokens=600,
        messages=[
            {
                "role":"user",
                "content": prompt
            }
            
        ],
    )

    clean = (
        response.content[0].text.strip().strip("```json").strip("```").strip()
    )

    return json.loads(clean)

