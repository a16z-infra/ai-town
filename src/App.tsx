import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GamePage from './GamePage';
import ConfigPage from './pages/ConfigPage';
import ConvexClientProvider from './components/ConvexClientProvider';

 export default function App() {
  return (
    <ConvexClientProvider>
      <BrowserRouter basename='/ai-town'>
        <Routes>
          <Route path="/" element={<GamePage />}/>
          <Route path="/config" element={<ConfigPage />}/>
        </Routes>  
      </BrowserRouter>
    </ConvexClientProvider>
  )
 }