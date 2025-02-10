import type React from "react"
import "./DeleteConfirmationModal.css"

interface DeleteConfirmationModalProps {
  characterName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  characterName,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content delete-confirmation-modal">
        <h2 className="pixel-subtitle">Confirm Deletion</h2>
        <p>Are you sure you want to delete the character "{characterName}"?</p>
        <div className="modal-actions">
          <button className="pixel-btn" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </button>
          <button className="pixel-btn delete-btn" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  )
}
