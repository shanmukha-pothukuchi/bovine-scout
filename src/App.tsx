import './App.css'
import RadialMenu from './components/RadialMenu'

function App() {
  return (
    <RadialMenu
      menu={[
        { id: "defense", label: "Defense" },
        {
          id: "utility", label: "Utility",
        },
        {
          id: "offense", label: "Offense",
          children: [
            {
              id: "magic", label: "Magic",
              children: [
                { id: "fire", label: "Fire" },
                { id: "ice", label: "Ice" },
                { id: "lightning", label: "Lightning" },
              ]
            },
            {
              id: "melee", label: "Melee",
            },
            { id: "ranged", label: "Ranged" },
          ]
        },
        { id: "support", label: "Support" }
      ]}
      onChange={(e) => {
        console.log("Selected item:", e);
      }}
      onNavigation={(e) => {
        console.log("Navigation path:", e);
      }}
    />
  )
}

export default App
