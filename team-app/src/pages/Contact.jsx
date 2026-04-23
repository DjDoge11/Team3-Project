import React, { useState } from 'react';

export default function Grades() {
  
  const [cards, setCards] = useState([
    { id: 1, title: "Card 1" },
    { id: 2, title: "Card 2" }
  ]);

  const addCard = () => {
    const newCard = { 
      id: Date.now(), 
      content: `Card #${cards.length + 1}` 
    };
    setCards([...cards, newCard]);
  };

  const removeCard = (id) => {
    setCards(cards.filter(card => card.id !== id));
  };
  
  return (
    <main>
      <h1>Grade Calculator</h1>
      <p></p>
      <button onClick={addCard}>Add Section</button> <button onClick={removeCard}>Remove Section</button>
      
      <div className="container">
        {cards.map((card) => (
          /* Pass the remove logic down as a prop */
          <Card 
            key={card.id} 
            text={card.content} 
            onRemove={() => removeCard(card.id)} 
          />
        ))}
      </div>
    </main>
  );
}
function Card({ }) {
  return (
    <div className="card">
      <h2>Category: <input
                      type="text"
                      placeholder="Enter category name here!"
                      style={{ padding: '1rem', width: '10rem' }}
                    /> Weight: <input
                      type="text"
                      placeholder="Enter percentage here!"
                      style={{ padding: '1rem', width: '10rem' }}
                    /> Points: <input
                      type="text"
                      placeholder="Enter points here!"
                      style={{ padding: '1rem', width: '10rem' }}
                    /></h2> 
    </div>
  );
}


