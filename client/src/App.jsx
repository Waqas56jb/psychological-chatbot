import { useState } from 'react';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import './App.css';

export default function App() {
  const [page, setPage] = useState('landing');
  return page === 'chat'
    ? <Chat onBack={() => setPage('landing')} />
    : <Landing onStart={() => setPage('chat')} />;
}
