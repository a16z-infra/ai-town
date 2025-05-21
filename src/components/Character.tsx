import React from 'react';

// Placeholder for Character component
// TODO: Implement with Three.js
export const Character: React.FC<any> = (props) => {
  console.log('Character props:', props);
  return (
    <div style={{ border: '1px solid red', padding: '10px', margin: '5px' }}>
      <p>Character: {props.name || 'Unnamed'}</p>
      <p>Position: ({props.x}, {props.y})</p>
      {/* Add more relevant prop displays as needed */}
    </div>
  );
};

export default Character;
