
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from './AuthContext';
import Layout from './components/Layout';
import About from './pages/About';
import Analytics from './pages/Analytics';
import BookDetails from './pages/BookDetails';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import HowAIWorks from './pages/HowAIWorks';
import KnowledgeBase from './pages/KnowledgeBase';
import MyLibrary from './pages/MyLibrary';
import Peas from './pages/Peas';
import Reasoning from './pages/Reasoning';
import Recommend from './pages/Recommend';
import Search from './pages/Search';
import SimilarBooks from './pages/SimilarBooks';
import StudyCompanion from './pages/StudyCompanion';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public authentication landing routes */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />

          {/* Authenticated application routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="home" element={<Home />} />
            <Route path="recommend" element={<Recommend />} />
            <Route path="explore" element={<Explore />} />
            <Route path="search" element={<Search />} />
            <Route path="similar" element={<SimilarBooks />} />
            <Route path="study" element={<StudyCompanion />} />
            <Route path="library" element={<MyLibrary />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="availability" element={<Navigate to="/search" replace />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="books/:id" element={<BookDetails />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="reasoning" element={<Reasoning />} />
            <Route path="peas" element={<Peas />} />
            <Route path="how-ai-works" element={<HowAIWorks />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
