import { useState } from "react"
import { useMutation,useQuery } from "convex/react"
import{ api }from "../../convex/_generated/api"
import mapConfig from "../../data/maps/mapConfig";
import "./ConfigPage.css"


// 模拟地图数据
// const maps = Array.from({ length: 20 }, (_, i) => ({
//   id: i + 1,
//   name: `Map ${i + 1}`,
//   thumbnail: `https://picsum.photos/seed/${i + 1}/200/100`,
//   description: `This is Map ${i + 1}. Many exciting adventures await you here!`,
// }))


function ConfigPage() {
  const [activeSection, setActiveSection] = useState<"map" | "character">("map")
  const [selectedMap, setSelectedMap] = useState<string | undefined>(mapConfig.defaultMap)
  const [tempSelectedMap, setTempSelectedMap] = useState<string | undefined>(mapConfig.defaultMap)
  const [hasChanges, setHasChanges] = useState(false)

  const initWorld=useMutation(api.init.default)
  const clearTable=useMutation(api.testing.wipeAllTables)
  const resetWorld=useMutation(api.testing.resetWorldForNewMap)
  const resumeWorld = useMutation(api.testing.resume);

  // const handleSave = () => {
  //   if (activeSection === "map") {
  //     setSelectedMap(tempSelectedMap)
  //     alert("Save successful: Map selection updated")
  //     setHasChanges(false)
  //   }
  // }
  const handleSave= async () => {
    if(activeSection==="map") {
      try{
        await resetWorld()
        await initWorld({
          numAgents:undefined,
          mapId:tempSelectedMap
        });
        setSelectedMap(tempSelectedMap)
        alert("Save successful: Map selection updated")
        setHasChanges(false)
        console.log(selectedMap)
      }catch(error){
        console.error("Failed to save map selection", error)
        alert('Failed to save map' + error)
      }
    }
  }

  const handleCancel = () => {
    if (activeSection === "map") {
      setTempSelectedMap(selectedMap)
      setHasChanges(false)
    }
  }

  const handleStartGame = async () => {
    if (selectedMap) {
      console.log("Starting game", selectedMap )
      // Add game start logic here
      try{
        await initWorld({
          mapId:selectedMap,
          numAgents:undefined
        });
      }catch(error){
        console.error("Failed to start game",error)
        alert("Failed to start game"+error)
      }
    } else {
      alert("Cannot start game: Please select a map first!")
    }
  }

  return (
    <div className="config-container">
      <h1>Adventure World Setup</h1>
      <div className="config-game-setup">
        {/* Left sidebar buttons */}
        <div className="config-sidebar">
          <button onClick={() => setActiveSection("map")} className={activeSection === "map" ? "active" : ""}>
            Select Map
          </button>
          <button
            onClick={() => setActiveSection("character")}
            className={activeSection === "character" ? "active" : ""}
          >
            Edit Character
          </button>
          <button onClick={handleStartGame} className="config-start-game">
            Start Adventure!
          </button>
        </div>

        {/* Middle list area */}
        <div className="config-list-area">
          {activeSection === "map" ? (
            <div className="config-map-list">
              {mapConfig.availableMaps.map((map) => (
                <div
                  key={map.id}
                  className={`map-item ${tempSelectedMap === map.id ? "selected" : ""}`}
                  onClick={() => {
                    setTempSelectedMap(map.id)
                    setHasChanges(true)
                  }}
                >
                  {map.name} (ID: {map.id})
                </div>
              ))}
            </div>
          ) : (
            <div className="character-placeholder">
              <p>Character list coming soon</p>
            </div>
          )}
        </div>

        {/* Right details and action area */}
        <div className="config-details-area">
          {activeSection === "map" && tempSelectedMap ? (
            <div className="config-map-details">
              <h2>{mapConfig.availableMaps.find((m) => m.id === tempSelectedMap)?.name}</h2>
              <img
                src={mapConfig.availableMaps.find((m) => m.id === tempSelectedMap)?.thumbnail || "/placeholder.svg"}
                alt="Map preview"
              />
              <p>{mapConfig.availableMaps.find((m) => m.id === tempSelectedMap)?.description}</p>
              <div className="config-action-buttons">
                <button onClick={handleCancel} disabled={!hasChanges}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={!hasChanges}>
                  Save
                </button>
              </div>
            </div>
          ) : activeSection === "character" ? (
            <div className="character-placeholder">
              <p>Character editing coming soon</p>
            </div>
          ) : (
            <div className="map-placeholder">
              <p>Select a map to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfigPage
