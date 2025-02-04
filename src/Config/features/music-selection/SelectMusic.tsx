import type React from "react"
import "./SelectMusic.css"

// Note: In a real application, you would import API functions from a separate file
// import { fetchSongs } from '../../api/music'

// Note: This is mock data. In a real application, this data would come from the backend API.
const songs: Song[] = [
  { id: 1, name: "Adventure Theme" },
  { id: 2, name: "Mysterious Forest" },
  { id: 3, name: "Epic Battle" },
]

type Song = {
  id: number
  name: string
}

type SelectMusicProps = {
  selectedMusic: number | null
  setSelectedMusic: (id: number) => void
  onBack: () => void
  onSave: () => void
}

export const SelectMusic: React.FC<SelectMusicProps> = ({ selectedMusic, setSelectedMusic, onBack, onSave }) => {
  // Note: In a real application, you would fetch songs from the backend when the component mounts
  // useEffect(() => {
  //   const loadSongs = async () => {
  //     const fetchedSongs = await fetchSongs()
  //     // Update the state with fetched songs
  //   }
  //   loadSongs()
  // }, [])

  return (
    <div className="pixel-container">
      <h1 className="pixel-title">Choose Your Music</h1>
      <div className="pixel-content">
        <div className="pixel-list">
          {songs.map((song) => (
            <div
              key={song.id}
              className={`pixel-item ${selectedMusic === song.id ? "selected" : ""}`}
              onClick={() => setSelectedMusic(song.id)}
            >
              <span>{song.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pixel-actions">
        <button className="pixel-btn" onClick={onBack}>
          Back
        </button>
        <button className="pixel-btn" onClick={onSave} disabled={!selectedMusic}>
          Save
        </button>
      </div>
    </div>
  )
}

