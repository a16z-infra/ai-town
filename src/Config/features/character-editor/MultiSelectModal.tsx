import type React from "react"
import { Check, X } from "lucide-react"
import "./MultiSelectModal.css"

type Character = {
  id: number
  name: string
  preview: string
}

type MultiSelectModalProps = {
  characters: Character[]
  selectedCharacters: number[]
  onSelect: (id: number) => void
  onClose: () => void
  onSave: () => void
}

export const MultiSelectModal: React.FC<MultiSelectModalProps> = ({
  characters,
  selectedCharacters,
  onSelect,
  onClose,
  onSave,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="pixel-subtitle">Select Multiple Characters</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="character-grid">
          {characters.map((character) => (
            <div
              key={character.id}
              className={`character-card ${selectedCharacters.includes(character.id) ? "selected" : ""}`}
              onClick={() => onSelect(character.id)}
            >
              <img src={character.preview || "/placeholder.svg"} alt={character.name} className="character-avatar" />
              <span className="character-name">{character.name}</span>
              {selectedCharacters.includes(character.id) && <Check className="check-icon" size={24} />}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="pixel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="pixel-btn" onClick={onSave} disabled={selectedCharacters.length === 0}>
            Save Selection
          </button>
        </div>
      </div>
    </div>
  )
}

