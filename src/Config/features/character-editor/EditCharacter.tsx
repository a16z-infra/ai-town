import type React from "react"
import { useState } from "react"
import { Upload, X } from "lucide-react"
import "./EditCharacter.css"
import { MultiSelectModal } from "./MultiSelectModal"
import { SpriteSelectionModal } from "./SpriteSelectionModal"

// Note: In a real application, you would import API functions from a separate file
// import { fetchCharacters, createCharacter, updateCharacter, deleteCharacter } from '../api/characters'

type Character = {
  id: number
  name: string
  description: string
  goals: string
  preview: string
  isCustom?: boolean
}

// Note: This is mock data. In a real application, this data would come from the backend API.
const predefinedCharacters: Character[] = [
  {
    id: 1,
    name: "Predefine 1",
    description: "A brave adventurer who likes math and solving puzzles.",
    goals: "To become the greatest mathematician in the realm",
    preview: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 2,
    name: "Predefine 2",
    description: "A mysterious wanderer with a passion for science.",
    goals: "To discover new magical formulas",
    preview: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 3,
    name: "Predefine 3",
    description: "A curious explorer who loves learning.",
    goals: "To build the biggest library in the world",
    preview: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 4,
    name: "Bob",
    description: "A friendly mathematician who likes solving complex problems.",
    goals: "To teach math to everyone in the kingdom",
    preview: "/placeholder.svg?height=200&width=200",
  },
]

type EditCharacterProps = {
  selectedCharacter: number | null
  setSelectedCharacter: (id: number) => void
  onBack: () => void
  onNext: () => void
}

export const EditCharacter: React.FC<EditCharacterProps> = ({
  selectedCharacter,
  setSelectedCharacter,
  onBack,
  onNext,
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [showMultiSelectModal, setShowMultiSelectModal] = useState(false)
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([])
  const [showSpriteModal, setShowSpriteModal] = useState(false)

  // Note: In a real application, you would fetch characters from the backend when the component mounts
  // useEffect(() => {
  //   const loadCharacters = async () => {
  //     const characters = await fetchCharacters()
  //     // Update the state with fetched characters
  //   }
  //   loadCharacters()
  // }, [])

  const handleImageUpload = () => {
    setShowSpriteModal(true)
  }

  const handleSpriteSelect = (sprite: string) => {
    if (editingCharacter) {
      setEditingCharacter((prev) => ({
        ...prev!,
        preview: `/sprites/${sprite}.png`,
      }))
    }
    setShowSpriteModal(false)
  }

  const handleSave = () => {
    if (editingCharacter) {
      // Note: In a real application, you would call the backend API here
      // if (editingCharacter.id) {
      //   await updateCharacter(editingCharacter)
      // } else {
      //   const newCharacter = await createCharacter(editingCharacter)
      //   setSelectedCharacter(newCharacter.id)
      // }

      const index = predefinedCharacters.findIndex((c) => c.id === editingCharacter.id)
      if (index !== -1) {
        predefinedCharacters[index] = editingCharacter
      } else {
        predefinedCharacters.push(editingCharacter)
      }
      setSelectedCharacter(editingCharacter.id)
      setIsEditing(false)
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
    setEditingCharacter(null)
  }

  const currentCharacter = predefinedCharacters.find((char) => char.id === selectedCharacter)

  const renderCharacterForm = () => (
    <div className="character-details">
      <div className="character-header">
        <input
          type="text"
          className="pixel-input"
          placeholder={isCreating ? "Agent Name" : "Character Name"}
          value={editingCharacter?.name || ""}
          onChange={(e) => setEditingCharacter((prev) => ({ ...prev!, name: e.target.value }))}
        />
      </div>
      <div className="character-preview">
        <div className="preview-upload">
          <img
            src={editingCharacter?.preview || "/placeholder.svg"}
            alt="Character preview"
            className="preview-image"
          />
          <button className="upload-btn pixel-btn" onClick={handleImageUpload}>
            <Upload size={16} />
            Choose Sprite
          </button>
        </div>
      </div>
      <div className="character-info">
        <div className="info-section">
          <h3>Description</h3>
          <textarea
            className="pixel-textarea"
            value={editingCharacter?.description || ""}
            onChange={(e) => setEditingCharacter((prev) => ({ ...prev!, description: e.target.value }))}
            placeholder="Enter character description..."
          />
        </div>
        <div className="info-section">
          <h3>Goals</h3>
          <textarea
            className="pixel-textarea"
            value={editingCharacter?.goals || ""}
            onChange={(e) => setEditingCharacter((prev) => ({ ...prev!, goals: e.target.value }))}
            placeholder="Enter character goals..."
          />
        </div>
      </div>
      <div className="edit-actions">
        <button className="pixel-btn" onClick={handleCancel}>
          Cancel
        </button>
        <button className="pixel-btn" onClick={handleSave} disabled={!editingCharacter?.name}>
          Save
        </button>
      </div>
    </div>
  )

  const renderCharacterDetails = () => (
    <div className="character-details">
      {selectedCharacter ? (
        <>
          <div className="character-header">
            <h2 className="character-name">{currentCharacter?.name}</h2>
          </div>
          <div className="character-preview-container">
            <img
              src={currentCharacter?.preview || "/placeholder.svg"}
              alt={`${currentCharacter?.name} preview`}
              className="preview-image"
            />
            <div className="character-actions">
              <button
                className="pixel-btn"
                onClick={() => {
                  setEditingCharacter(currentCharacter!)
                  setIsEditing(true)
                }}
              >
                Edit Character
              </button>
              <button className="pixel-btn advanced-btn">Advanced</button>
            </div>
          </div>
          <div className="character-info">
            <div className="info-section">
              <h3>Description</h3>
              <div className="scrollable-text">{currentCharacter?.description}</div>
            </div>
            <div className="info-section">
              <h3>Goals</h3>
              <div className="scrollable-text">{currentCharacter?.goals}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="character-placeholder">
          <p className="pixel-message">Select a character to view details</p>
        </div>
      )}
    </div>
  )

  const renderCharacterList = () => (
    <div className="character-list-container">
      <div className="list-actions">
        <button
          className="pixel-btn"
          onClick={() => {
            setEditingCharacter({
              id: Math.max(...predefinedCharacters.map((c) => c.id)) + 1,
              name: "",
              description: "",
              goals: "",
              preview: "/placeholder.svg?height=200&width=200",
              isCustom: true,
            })
            setIsCreating(true)
          }}
        >
          Create Agent
        </button>
        <button className="pixel-btn" onClick={() => setShowMultiSelectModal(true)}>
          Multi Select
        </button>
      </div>
      <div className="character-list">
        {predefinedCharacters.map((character) => (
          <div
            key={character.id}
            className={`pixel-item ${selectedCharacter === character.id ? "selected" : ""}`}
            onClick={() => setSelectedCharacter(character.id)}
          >
            <img src={character.preview || "/placeholder.svg"} alt={character.name} className="character-thumbnail" />
            <span>{character.name}</span>
            {character.isCustom && <span className="custom-badge">Custom</span>}
          </div>
        ))}
      </div>
    </div>
  )

  const renderSelectedCharactersThumbnails = () => (
    <div className="selected-characters-thumbnails">
      <h3 className="pixel-subtitle">Selected Characters</h3>
      <div className="thumbnails-container">
        {selectedCharacters.map((id) => {
          const character = predefinedCharacters.find((c) => c.id === id)
          return (
            <div key={id} className="selected-thumbnail">
              <img src={character?.preview || "/placeholder.svg"} alt={character?.name} className="thumbnail-image" />
              <button
                className="remove-thumbnail"
                onClick={() => setSelectedCharacters((prev) => prev.filter((charId) => charId !== id))}
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="pixel-container">
      <h1 className="pixel-title">Edit Character</h1>
      <div className="pixel-content character-editor">
        <div className="character-list-container">
          {renderCharacterList()}
          {selectedCharacters.length > 0 && renderSelectedCharactersThumbnails()}
        </div>
        {isCreating || isEditing ? renderCharacterForm() : renderCharacterDetails()}
      </div>
      <div className="pixel-actions">
        <button className="pixel-btn" onClick={onBack}>
          Back
        </button>
        <button className="pixel-btn" onClick={onNext} disabled={!selectedCharacter && selectedCharacters.length === 0}>
          Next
        </button>
      </div>
      {showMultiSelectModal && (
        <MultiSelectModal
          characters={predefinedCharacters}
          selectedCharacters={selectedCharacters}
          onSelect={(id) => {
            setSelectedCharacters((prev) =>
              prev.includes(id) ? prev.filter((charId) => charId !== id) : [...prev, id],
            )
          }}
          onClose={() => {
            setShowMultiSelectModal(false)
            setSelectedCharacters([])
          }}
          onSave={() => {
            setShowMultiSelectModal(false)
            // Here you would typically do something with the selected characters
            console.log("Selected characters:", selectedCharacters)
          }}
        />
      )}
      {showSpriteModal && (
        <SpriteSelectionModal onSelect={handleSpriteSelect} onClose={() => setShowSpriteModal(false)} />
      )}
    </div>
  )
}

