import React, { useState } from 'react';

export default function Grades() {
  
  const handleInputChange = (id, field, value) => {
    setCards(cards.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ));
  };

  const [cards, setCards] = useState([
    { id: 1, title: "Card 1" },
    { id: 2, title: "Card 2" }
  ]);

  const addCard = () => {
    const newCard = { 
      id: Date.now(), 
      content: `Card #${cards.length + 1}`,
      weight: "", 
      points: "",
      pointsTotal: "" 
    };
    setCards([...cards, newCard]);
  };

  const removeCard = (id) => {
    setCards(cards.filter(card => card.id !== id));
  };

  const totalGrade = cards.reduce((acc, card) => {
    const w = parseFloat(card.weight) || 0;
    const p = parseFloat(card.points) || 0;
    const t = parseFloat(card.pointsTotal) || 0;
    return acc + (w * (p / t));
  }, 0);
  
  return (
    <main>
      <h1>Grade Calculator</h1>
      <p></p>
      <h3>Your Calculated Grade: {totalGrade.toFixed(2)}%</h3>
      <div className="container">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            card={card}
            onInputChange={(field, val) => handleInputChange(card.id, field, val)}
            onRemove={() => removeCard(card.id)} 
          />
        ))}
      </div>
      <button onClick={addCard}>Add Section</button>
    </main>
  );
}
function Card({ title, onInputChange, onRemove }) {
  return (
    <div className="card">
      {title}
      <h2>Category: <input
                      type="text"
                      placeholder="Enter category name here!"
                      style={{ padding: '1rem', width: '10rem' }}
                    /> Weight: <input
                      type="number"
                      value={Card.weight} 
                      onChange={(e) => onInputChange('weight', e.target.value)}
                      placeholder="Enter percentage here!"
                      style={{ padding: '1rem', width: '10rem' }}
                    /> Points: <input
                      type="number"
                      value={Card.points} 
                      onChange={(e) => onInputChange('points', e.target.value)} 
                      placeholder="Enter points here!"
                      style={{ padding: '1rem', width: '10rem' }}
                    /> / <input
                      type="number"
                      value={Card.pointsTotal} 
                      onChange={(e) => onInputChange('pointsTotal', e.target.value)} 
                      placeholder="Enter points here!"
                      style={{ padding: '1rem', width: '10rem' }}
                    />    <button onClick={onRemove} style={{ color: 'red'}}>Delete</button> </h2>
    </div>
  );
}


