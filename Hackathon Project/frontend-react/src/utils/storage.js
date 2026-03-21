const BACKEND = process.env.REACT_APP_BACKEND_URL;

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function getTodaysMeals() {
  const res = await fetch(`${BACKEND}/get-meals`, { headers: authHeaders() });
  const data = await res.json();
  if (data.error) return [];
  return data.map(m => ({
    ...m,
    timestamp: m.logged_at
  }));
}

export async function saveMeal(meal) {
  const res = await fetch(`${BACKEND}/log-meal`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...meal, timestamp: new Date().toISOString() })
  });
  return res.json();
}

export async function deleteMeal(id) {
  await fetch(`${BACKEND}/delete-meal/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export function getTotals(meals) {
  return meals.reduce((acc, m) => ({
    cal: acc.cal + (m.calories || 0),
    protein: acc.protein + (m.protein_g || 0),
    carbs: acc.carbs + (m.carbs_g || 0),
    fat: acc.fat + (m.fat_g || 0),
    cost: acc.cost + (m.cost || 0)
  }), { cal: 0, protein: 0, carbs: 0, fat: 0, cost: 0 });
}
