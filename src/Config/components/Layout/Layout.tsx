import type React from "react"
import "./Layout.css"

interface LayoutProps {
  children: React.ReactNode
}

// Note: This component doesn't directly interact with the backend.
// It provides a consistent layout for the application.
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return <div className="pixel-app">{children}</div>
}

