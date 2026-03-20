import React, { useState } from 'react';
import { saveMeal } from '../utils/storage';

export default function AddMealModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [protein, setProtein] = useState('');
  const [cost, setCost] = useState('');

  function handleSave() {
    if (!name.trim()) return;
    saveMeal({
      food_name: name.trim(),
      calories: parseInt(cal) || 0,
      protein_g: parseInt(protein) || 0,
      carbs_g: 0,
      fat_g: 0,
      cost: parseFloat(cost) || 0
    });
    onSaved();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Add meal
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Food name</label>
          <input
            className="form-input"
            placeholder="e.g. Chicken salad"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Calories</label>
            <input className="form-input" type="number" placeholder="400"
              value={cal} onChange={e => setCal(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Protein (g)</label>
            <input className="form-input" type="number" placeholder="30"
              value={protein} onChange={e => setProtein(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cost (£)</label>
            <input className="form-input" type="number" step="0.01" placeholder="2.50"
              value={cost} onChange={e => setCost(e.target.value)} />
          </div>
        </div>
        <button className="btn-save" onClick={handleSave}>Add to log</button>
      </div>
    </div>
  );
}
