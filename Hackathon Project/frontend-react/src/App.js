import React, { useState } from 'react';
import './styles.css';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Log from './pages/Log';

export default function App() {
  const [page, setPage] = useState('home');

  function navigate(to) {
    setPage(to);
    window.scrollTo(0, 0);
  }

  return (
    <div>
      {page === 'home'    && <Home    navigate={navigate} />}
      {page === 'scanner' && <Scanner navigate={navigate} />}
      {page === 'log'     && <Log     navigate={navigate} />}
    </div>
  );
}
