from dbClient import supabase

response = supabase.table("ingredients").select("*").execute()

print(response.data)