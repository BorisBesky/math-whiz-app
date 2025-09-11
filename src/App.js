import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import AdminPage from './components/AdminPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
};

export default App;
