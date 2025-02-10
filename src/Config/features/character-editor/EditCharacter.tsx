import type React from "react"
import { useState } from "react"
import { Upload, X } from "lucide-react"
import "./EditCharacter.css"
import { MultiSelectModal } from "./MultiSelectModal"
import { SpriteSelectionModal } from "./SpriteSelectionModal"
import { updateDescriptions } from "../../../../data/characters";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

// Note: In a real application, you would import API functions from a separate file
// import { fetchCharacters, createCharacter, updateCharacter, deleteCharacter } from '../api/characters'

type Character = {
  id: string //convex db id must be string
  name: string //name is name
  description: string //actually identity in db
  goals: string //hmmm.. =plans for backend!
  preview: string //not my thing but returns f*. Change ticked
  isCustom?: boolean //not my thing
}

type EditCharacterProps = {
  selectedCharacter: string | null
  setSelectedCharacter: (id: string) => void
  onBack: () => void
  onNext: () => void
}

export const EditCharacter: React.FC<EditCharacterProps> = ({
  selectedCharacter,
  setSelectedCharacter,
  onBack,
  onNext,
}) => {

  const agentDocs = useQuery(api["customizeAgents/queries"].getAgents) ?? []; //must do this. Convex thing. hate it.
  const predefinedCharacters = agentDocs.map((doc) => ({
  id: doc._id,
  name: doc.name,
  description: doc.identity,
  goals: doc.plan,
  preview: doc.character
    ? `/sprites/${doc.character}.png`
    : "/placeholder.svg?height=200&width=200",
  isCustom: true,
  }));
  const [isCreating, setIsCreating] = useState(false)
  //const [isEditing, setIsEditing] = useState(false) // Deleted isEditing status
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [showMultiSelectModal, setShowMultiSelectModal] = useState(false)
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const [showSpriteModal, setShowSpriteModal] = useState(false)
  //add delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  //add isDeleting status
  const [isDeleting, setIsDeleting] = useState(false)

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

  const createAgentMutation = useMutation(api["customizeAgents/mutations"].createAgent); //I want to mutate too. Damn.
  const updateAgentMutation = useMutation(api["customizeAgents/mutations"].updateAgent); //doesn't like my docker environment. Hate it more.
  const deleteAgentMutation = useMutation(api["customizeAgents/mutations"].deleteAgent); //add delete mutation
  const selectAgentForWorldMutation = useMutation(api["customizeAgents/mutations"].selectAgentForWorld);
  
  
  const handleSave = async () => {
    if (!editingCharacter) return;
  
    //判断新建还是eedit
    const existing = agentDocs.find((doc) => doc._id.id === editingCharacter.id);
    if (!existing) {
      // 新建
      await createAgentMutation({
        name: editingCharacter.name,
        //  还原成 "f*"()，目前用的predefined spritesheet template，改的粗
        character: editingCharacter.preview
          .replace("/sprites/", "")
          .replace(".png", ""),
        identity: editingCharacter.description,
        plan: editingCharacter.goals,
      });
    } else {
      // edit
      await updateAgentMutation({
        id: { tableName: "agents", id: editingCharacter.id },
        name: editingCharacter.name,
        character: editingCharacter.preview
          .replace("/sprites/", "")
          .replace(".png", ""),
        identity: editingCharacter.description,
        plan: editingCharacter.goals,
      });
    }
  
    setIsDeleting(false);
    setIsCreating(false);
    setEditingCharacter(null);
    // await updateDescriptions();
  };
  

  const handleCancel = () => {
    setIsDeleting(false)
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

  // const handleDeleteCharacter = () => {
  //   if (selectedCharacter) {
  //     setIsDeleting(true);
  //     deleteAgentMutation.mutate(selectedCharacter, {
  //       onSuccess: () => {
  //         // ... 其他代码 ... 
  //         // 删除成功后，更新预定义角色列表
  //         console.log("Deleting character:", selectedCharacter);
  //         // 删除成功后，更新预定义角色列表 
  //         const updatedCharacters = predefinedCharacters.filter(
  //           (char) => char.id !== selectedCharacter
  //         );
  //         // 更新预定义角色列表
  //         predefinedCharacters.splice(0, predefinedCharacters.length, ...updatedCharacters);
  //         setSelectedCharacter(null);
  //         setIsDeleting(false);
  //       },
  //       onError: (error) => {
  //         console.error("Error deleting character:", error);
  //         setIsDeleting(false);
  //       },
  //     });
  //   }
  // };

  const handleDeleteCharacter = async () => {
    if (selectedCharacter) {
      try {
        setIsDeleting(true);
        await deleteAgentMutation({ id: selectedCharacter });  // 直接调用，传入正确的参数
        
        setSelectedCharacter(null);
        setShowDeleteConfirmation(false);
        setIsDeleting(false);
        
        // 不需要手动更新 predefinedCharacters，因为 useQuery 会自动刷新
      } catch (error) {
        console.error("Error deleting character:", error);
        setIsDeleting(false);
      }
    }
  };
  
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
                className="pixel-btn delete-btn"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                Delete
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
              id: "temp-new-" + Date.now(), //placeholder id. yikes.
              name: "",
              description: "",
              goals: "",
              preview: "/placeholder.svg?height=200&width=200",
              isCustom: true,
            });
            setIsCreating(true);
          }}
          
        >
          Create Agent
        </button>
        <button className="pixel-btn" onClick={() => setShowMultiSelectModal(true)}>
          Add to World
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
        {isCreating ? renderCharacterForm() : renderCharacterDetails()}
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
          // onSave={() => {
          //   setShowMultiSelectModal(false)
          //   // Here you would typically do something with the selected characters
          //   console.log("Selected characters:", selectedCharacters)
          // }}

          onSave={async () => {
            try {
              await selectAgentForWorldMutation({
                agentIds: selectedCharacters
              });
              setShowMultiSelectModal(false);
              console.log("Selected characters saved:", selectedCharacters);
            } catch (error) {
              console.error("Error saving selected agents:", error);
            }
          }}
        />
      )}
      {showSpriteModal && (
        <SpriteSelectionModal onSelect={handleSpriteSelect} onClose={() => setShowSpriteModal(false)} />
      )}
      {showDeleteConfirmation && (
        <DeleteConfirmationModal
          characterName={currentCharacter?.name || ""}
          onConfirm={handleDeleteCharacter}
          onCancel={() => setShowDeleteConfirmation(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}