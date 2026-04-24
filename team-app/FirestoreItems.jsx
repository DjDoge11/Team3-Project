import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp } from 'firebase/firestore';
import './FirestoreItems.css';

function FirestoreItems() {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Real-time listener for items collection
  useEffect(() => {
    const q = query(collection(db, 'items'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsList = [];
      snapshot.forEach((doc) => {
        itemsList.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending (newest first)
      itemsList.sort((a, b) => b.createdAt - a.createdAt);
      setItems(itemsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add new item to Firestore
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (input.trim() === '') {
      alert('Please enter some text');
      return;
    }

    try {
      await addDoc(collection(db, 'items'), {
        text: input,
        createdAt: serverTimestamp()
      });
      setInput('');
    } catch (error) {
      console.error('Error adding item: ', error);
      alert('Error adding item. Check console for details.');
    }
  };

  return (
    <div className="firestore-container">
      <h1>Firestore Items</h1>
      
      <form onSubmit={handleAddItem} className="add-item-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a new item..."
          className="item-input"
        />
        <button type="submit" className="add-btn">Add Item</button>
      </form>

      {loading ? (
        <p className="loading">Loading items...</p>
      ) : items.length === 0 ? (
        <p className="no-items">No items yet. Add one to get started!</p>
      ) : (
        <div className="items-list">
          <h2>Items ({items.length})</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id} className="item-card">
                <div className="item-text">{item.text}</div>
                <div className="item-timestamp">
                  {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleString() : 'No date'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FirestoreItems;