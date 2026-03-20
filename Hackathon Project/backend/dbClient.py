from supabase import create_client, Client


url = "https://dupuljrdyiznjexlirud.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cHVsanJkeWl6bmpleGxpcnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTA5NTksImV4cCI6MjA4ODg4Njk1OX0.5E6EIkgyISkwST7zcBJP89MZmkm2B9DqpvpYIK2GaJg"

supabase: Client = create_client(url, key)