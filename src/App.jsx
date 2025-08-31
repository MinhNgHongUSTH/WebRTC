import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CallPage from './pages/CallPage/CallPage';
import HomePage from './pages/HomePage/HomePage';
import NoMatch from './pages/NoMatch/NoMatch';
import Dashboard from './pages/UserManagement/Dashboard';
import { UserProvider } from './UserContext';
import PrivateRoute from './pages/PrivateRoute';
import React from 'react';

import './App.scss';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route path="/meeting/:id" element={<CallPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NoMatch />} />

        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
