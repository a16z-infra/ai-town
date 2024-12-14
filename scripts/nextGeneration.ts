import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/game-state'; // adjust URL as needed

async function triggerNextGeneration() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer banana_jellybean',
      },
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

triggerNextGeneration();
