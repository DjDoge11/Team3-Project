import React, { useState } from 'react';

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
    { id: 1, category: '', percentOfGrade: '', points: '', max: '', percentage: '', mark: '' }
  ]);
  const [calculated, setCalculated] = useState(null);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (id, field, value) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, [field]: value } : card
    ));
    setError('');
  };

  const addCard = () => {
    const newCard = {
      id: Date.now(),
      category: '',
      percentOfGrade: '',
      points: '',
      max: '',
      percentage: '',
      mark: ''
    };
    setCards([...cards, newCard]);
    setError('');
  };

  const removeCard = (id) => {
    if (cards.length === 1) {
      setError('You must keep at least one row.');
      return;
    }
    setCards(cards.filter(card => card.id !== id));
    setError('');
  };

  const calculateGrade = () => {
    const emptyFields = cards.some(card =>
      !card.category || card.percentOfGrade === '' || card.points === '' || card.max === ''
    );

    if (emptyFields) {
      setError(`Please fill in all fields (Category, Percent of Grade, Points, and Max) for all ${cards.length} rows before calculating.`);
      setCalculated(null);
      return;
    }

    let total = 0;
    const updatedCards = cards.map(card => {
      const p = parseFloat(card.points) || 0;
      const m = parseFloat(card.max) || 0;
      const pct = parseFloat(card.percentOfGrade) || 0;

      const rowPercent = m > 0 ? (p / m) * 100 : 0;
      const rowValue = m > 0 ? (p / m) * pct : 0;
      total += rowValue;

      return {
        ...card,
        percentage: rowPercent.toFixed(2),
        mark: getLetterGrade(rowPercent)
      };
    });

    setCards(updatedCards);
    setCalculated({
      percent: total,
      letter: getLetterGrade(total)
    });
    setError('');
  };

  const getUsedLimitedCategories = (currentId) => {
    const used = new Set();
    cards.forEach(card => {
      if (card.id !== currentId && LIMITED_CATEGORIES.includes(card.category)) {
        used.add(card.category);
      }
    });
    return used;
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#19647E', margin: 0 }}>Grade Calculator</h1>
        <button
          onClick={() => setShowHelpPopup(true)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid #19647E',
            backgroundColor: '#ffffff',
            color: '#19647E',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ?
        </button>
      </div>

      {showHelpPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowHelpPopup(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '2px solid #28AFB0',
              maxWidth: '500px',
              width: '90%',
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelpPopup(false)}
              style={{
                position: 'absolute',
                top: '0.75rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#19647E',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h2 style={{ color: '#19647E', marginTop: 0 }}>How to Use</h2>
            <p style={{ color: '#1C2541', lineHeight: '1.6' }}>
              1. Select a Category for each row.<br />
              2. Enter the Percent of Grade (weight).<br />
              3. Enter Points earned and Max possible points.<br />
              4. Click Calculate to see your total grade.
            </p>
            <p style={{ color: '#1C2541', lineHeight: '1.6' }}>
              <strong>Note:</strong> Assignments/Classwork, Projects, Quizzes, and Tests can only be used once. "Other" can be used multiple times.
            </p>
            <button
              onClick={() => setShowHelpPopup(false)}
              style={{
                marginTop: '1rem',
                backgroundColor: '#28AFB0',
                color: '#EEE5E5',
                border: 'none',
                padding: '0.6rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {calculated && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '2px solid #28AFB0',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#19647E' }}>Total Grade</h2>
          <p style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold', color: '#1C2541' }}>
            {calculated.letter} — {calculated.percent.toFixed(2)}%
          </p>
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        border: '2px solid #28AFB0',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 1fr 80px',
          backgroundColor: '#19647E',
          color: '#EEE5E5',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          <div style={{ padding: '0.75rem 1rem' }}>Category</div>
          <div style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Percent of Grade</div>
          <div style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Points</div>
          <div style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Max</div>
          <div style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Percentage</div>
          <div style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Mark</div>
          <div style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Remove</div>
        </div>

        <div>
          {cards.map((card) => {
            const used = getUsedLimitedCategories(card.id);
            return (
              <div
                key={card.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 1fr 80px',
                  alignItems: 'center',
                  borderBottom: '1px solid #e0e0e0',
                  padding: '0.5rem 0'
                }}
              >
                <div style={{ padding: '0 0.5rem' }}>
                  <select
                    value={card.category}
                    onChange={(e) => handleInputChange(card.id, 'category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '0.4rem',
                      border: '2px solid #28AFB0',
                      backgroundColor: '#ffffff',
                      color: '#1C2541',
                      fontSize: '0.95rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Category</option>
                    {ALL_CATEGORIES.map(cat => {
                      const disabled = LIMITED_CATEGORIES.includes(cat) && used.has(cat);
                      return (
                        <option key={cat} value={cat} disabled={disabled}>
                          {cat} {disabled ? '(used)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ padding: '0 0.5rem' }}>
                  <input
                    type="number"
                    value={card.percentOfGrade}
                    onChange={(e) => handleInputChange(card.id, 'percentOfGrade', e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '0.4rem',
                      border: '2px solid #28AFB0',
                      backgroundColor: '#ffffff',
                      color: '#1C2541',
                      fontSize: '0.95rem',
                      outline: 'none',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ padding: '0 0.5rem' }}>
                  <input
                    type="number"
                    value={card.points}
                    onChange={(e) => handleInputChange(card.id, 'points', e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '0.4rem',
                      border: '2px solid #28AFB0',
                      backgroundColor: '#ffffff',
                      color: '#1C2541',
                      fontSize: '0.95rem',
                      outline: 'none',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ padding: '0 0.5rem' }}>
                  <input
                    type="number"
                    value={card.max}
                    onChange={(e) => handleInputChange(card.id, 'max', e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '0.4rem',
                      border: '2px solid #28AFB0',
                      backgroundColor: '#ffffff',
                      color: '#1C2541',
                      fontSize: '0.95rem',
                      outline: 'none',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ padding: '0 0.5rem', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '0.4rem',
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                    color: '#1C2541',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    boxSizing: 'border-box'
                  }}>
                    {card.percentage ? `${card.percentage}%` : '-'}
                  </span>
                </div>

                <div style={{ padding: '0 0.5rem', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '0.4rem',
                    border: '2px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                    color: '#1C2541',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    boxSizing: 'border-box'
                  }}>
                    {card.mark || '-'}
                  </span>
                </div>

                <div style={{ padding: '0 0.5rem', textAlign: 'center' }}>
                  <button
                    onClick={() => removeCard(card.id)}
                    style={{
                      backgroundColor: '#c0392b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      borderRadius: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={addCard}
          style={{
            backgroundColor: '#28AFB0',
            color: '#EEE5E5',
            border: 'none',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
        >
          Add Row
        </button>

        <button
          onClick={calculateGrade}
          style={{
            backgroundColor: '#19647E',
            color: '#EEE5E5',
            border: 'none',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
        >
          Calculate
        </button>
      </div>

      {error && (
        <p style={{
          color: '#c0392b',
          fontWeight: 600,
          fontSize: '0.95rem',
          margin: '1rem 0 0 0',
          backgroundColor: '#fdecea',
          padding: '0.6rem 1rem',
          borderRadius: '0.4rem',
          border: '1px solid #e74c3c',
          maxWidth: '760px'
        }}>
          {error}
        </p>
      )}
    </main>
  );
}

