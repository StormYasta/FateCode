import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { LearningPaths } from './pages/LearningPaths';
import { LearningPathDetail } from './pages/LearningPathDetail';
import { Assignments } from './pages/Assignments';
import { AcademicHierarchy } from './pages/AcademicHierarchy';
import { Classes } from './pages/Classes';
import { ClassDetail } from './pages/ClassDetail';
import { Profile } from './pages/Profile';
import { CodewarsImport } from './pages/CodewarsImport';
import { ChallengeSolve } from './pages/ChallengeSolve';
import { Rankings } from './pages/Rankings';
import { TeacherDashboard } from './pages/TeacherDashboard';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated layout routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/learning-paths" element={<LearningPaths />} />
            <Route path="/learning-paths/:slug" element={<LearningPathDetail />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/academic" element={<AcademicHierarchy />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ClassDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/codewars-import" element={<CodewarsImport />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/challenges/:idOrSlug" element={<ChallengeSolve />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
