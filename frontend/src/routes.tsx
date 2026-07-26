import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { BuilderPage } from '@/features/builder/BuilderPage';
import { VaultPage } from '@/features/vault/VaultPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/builder/new" element={<BuilderPage />} />
        <Route path="/builder/:name" element={<BuilderPage />} />
        <Route path="/characters" element={<VaultPage />} />
      </Routes>
    </BrowserRouter>
  );
}