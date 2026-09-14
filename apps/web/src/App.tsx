import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SkipLink } from "./components/layout/SkipLink";
import { HomePage } from "./pages/HomePage";
import { PlayPage } from "./pages/PlayPage";

export default function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
