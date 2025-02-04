// Note: These types should match the data structures returned by the backend API.
// In a real application, you might generate these types from API documentation or schemas.

export type Map = {
    id: number
    name: string
    thumbnail: string
    description: string
  }
  
  export type Character = {
    id: number
    name: string
    description: string
    goals: string
    preview: string
    isCustom?: boolean
  }
  
  export type Music = {
    id: number
    name: string
  }
  
  