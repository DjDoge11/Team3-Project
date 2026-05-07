import React, { useState } from 'react';
import './Grade.css';

function getLetterGrade(percent) {
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
}

const LIMITED_CATEGORIES = ['Assignments/Classwork', 'Projects', 'Quizzes', 'Tests'];
const ALL_CATEGORIES = [...LIMITED_CATEGORIES, 'Other'];

export default function Grades() {
  const [cards, setCards] = useState([
    { id: 1, category: '', percentOfGrade: '', points: '', max: '', percentage: '', mark: '' },
  ]);
  const [calculated, setCalculated] = useState(null);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (id, field, value) => {
    setCards(cards.map((card) => (card.id === id ? { ...card, [field]: value } : card)));
    setError('');
  };

  const addCard = () => {
    setCards([...cards, { id: Date.now(), category: '', percentOfGrade: '', points: '', max: '', percentage: '', mark: '' }]);
    setError('');
  };

  const removeCard = (id) => {
    if (cards.length === 1) {
      setError('You must keep at least one row.');
      return;
    }
    setCards(cards.filter((card) => card.id !== id));
    setError('');
  };

  const calculateGrade = () => {
    const emptyFields = cards.some((card) => !card.category || card.percentOfGrade === '' || card.points === '' || card.max === '');

    if (emptyFields) {
      setError(`Please fill in all fields for all ${cards.length} rows before calculating.`);
      setCalculated(null);
      return;
    }

    let total = 0;
    const updatedCards = cards.map((card) => {
      const points = parseFloat(card.points) || 0;
      const max = parseFloat(card.max) || 0;
      const weight = parseFloat(card.percentOfGrade) || 0;
      const rowPercent = max > 0 ? (points / max) * 100 : 0;
      total += max > 0 ? (points / max) * weight : 0;
      return { ...card, percentage: rowPercent.toFixed(2), mark: getLetterGrade(rowPercent) };
    });

    setCards(updatedCards);
    setCalculated({ percent: total, letter: getLetterGrade(total) });
    setError('');
  };

  const getUsedLimitedCategories = (currentId) => {
    const used = new Set();
    cards.forEach((card) => {
      if (card.id !== currentId && LIMITED_CATEGORIES.includes(card.category)) used.add(card.category);
    });
    return used;
  };

  return (
    <main className="grade-page">
      <div className="grade-header">
        <div>
          <span className="home-eyebrow">Grade scenarios</span>
          <h1>Grade Calculator</h1>
        </div>
        <button className="question-mark-btn" onClick={() => setShowHelpPopup(true)}>?</button>
      </div>

      {showHelpPopup && (
        <div className="popup-overlay" onClick={() => setShowHelpPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close-x" onClick={() => setShowHelpPopup(false)}>x</button>
            <h2>How to Use</h2>
            <p>Select a category, enter its grade weight, then add points earned and max points. Calculate to see your total grade.</p>
            <p><strong>Note:</strong> Assignments/Classwork, Projects, Quizzes, and Tests can only be used once. Other can be used multiple times.</p>
          </div>
        </div>
      )}

      {calculated && (
        <section className="grade-result-card">
          <span>Total Grade</span>
          <strong>{calculated.letter} - {calculated.percent.toFixed(2)}%</strong>
        </section>
      )}

      <section className="grade-table-card">
        <div className="grade-table-head">
          <span>Category</span>
          <span>Weight</span>
          <span>Points</span>
          <span>Max</span>
          <span>Percent</span>
          <span>Mark</span>
          <span>Remove</span>
        </div>

        {cards.map((card) => {
          const used = getUsedLimitedCategories(card.id);
          return (
            <div className="grade-row" key={card.id}>
              <select value={card.category} onChange={(e) => handleInputChange(card.id, 'category', e.target.value)}>
                <option value="">Select Category</option>
                {ALL_CATEGORIES.map((cat) => {
                  const disabled = LIMITED_CATEGORIES.includes(cat) && used.has(cat);
                  return <option key={cat} value={cat} disabled={disabled}>{cat}{disabled ? ' (used)' : ''}</option>;
                })}
              </select>
              <input type="number" value={card.percentOfGrade} onChange={(e) => handleInputChange(card.id, 'percentOfGrade', e.target.value)} placeholder="0" />
              <input type="number" value={card.points} onChange={(e) => handleInputChange(card.id, 'points', e.target.value)} placeholder="0" />
              <input type="number" value={card.max} onChange={(e) => handleInputChange(card.id, 'max', e.target.value)} placeholder="0" />
              <span className="grade-output">{card.percentage ? `${card.percentage}%` : '-'}</span>
              <span className="grade-output">{card.mark || '-'}</span>
              <button className="delete-grade-btn" onClick={() => removeCard(card.id)}>Delete</button>
            </div>
          );
        })}
      </section>

      <div className="grade-actions">
        <button onClick={addCard}>Add Row</button>
        <button onClick={calculateGrade}>Calculate</button>
      </div>

      {error && <p className="gpa-error">{error}</p>}
    </main>
  );
}