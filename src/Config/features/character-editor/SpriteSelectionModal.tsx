import type React from "react"
import "./SpriteSelectionModal.css"

type SpriteSelectionModalProps = {
  onSelect: (sprite: string) => void
  onClose: () => void
}

const sprites = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"]

export const SpriteSelectionModal: React.FC<SpriteSelectionModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content sprite-selection-modal">
        <h2 className="pixel-subtitle">Choose a Sprite</h2>
        <div className="sprite-grid">
          {sprites.map((sprite) => (
            <button key={sprite} className="sprite-button" onClick={() => onSelect(sprite)}>
              <img src={`/sprites/${sprite}.png`} alt={`Sprite ${sprite}`} className="sprite-image" />
            </button>
          ))}
        </div>
        <button className="pixel-btn close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

