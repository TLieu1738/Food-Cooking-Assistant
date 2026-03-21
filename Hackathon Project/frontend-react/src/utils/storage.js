const KEY = 'nutriscan_meals';

export function getAllMeals() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

export function getTodaysMeals() {
  const todayStr = new Date().toISOString().slice(0, 10);
  return getAllMeals().filter(m => m.timestamp.slice(0, 10) === todayStr);
}

export function saveMeal(meal) {
  const all = getAllMeals();
  const newMeal = {
    ...meal,
    id: Date.now(),
    timestamp: new Date().toISOString()
  };
  all.push(newMeal);
  localStorage.setItem(KEY, JSON.stringify(all));
  return newMeal;
}

export function deleteMeal(id) {
  const all = getAllMeals().filter(m => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
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
