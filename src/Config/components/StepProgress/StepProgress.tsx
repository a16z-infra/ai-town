import type React from "react"
import "./StepProgress.css"

type StepProgressProps = {
  currentStep: number
  steps: string[]
}

// Note: This component doesn't directly interact with the backend.
// It displays the current progress based on the data passed from the parent component.
export const StepProgress: React.FC<StepProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="pixel-progress">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`pixel-step ${index <= currentStep ? "completed" : ""} ${index === currentStep ? "active" : ""}`}
        >
          <div className="pixel-step-number">{index + 1}</div>
          <div className="pixel-step-label">{step}</div>
        </div>
      ))}
    </div>
  )
}

