import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CallPage from './components/CallPage/CallPage';
import HomePage from './components/HomePage/HomePage';
import NoMatch from './components/NoMatch/NoMatch';
import Dashboard from './components/UserManagement/Dashboard';
import { UserProvider } from './UserContext';
import PrivateRoute from './components/PrivateRoute';

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

          <Route path="/:id" element={<CallPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NoMatch />} />

        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
