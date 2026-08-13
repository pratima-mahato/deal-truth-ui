import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { UploadPage } from "@/pages/UploadPage";
import { ProcessingPage } from "@/pages/ProcessingPage";
import { CallDetailPage } from "@/pages/CallDetailPage";
import { SearchPage } from "@/pages/SearchPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { DemoPage, SharedPage } from "@/pages/SharedPage";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/calls/new" element={<Navigate to="/upload" replace />} />
        <Route path="/calls/:callId/processing" element={<ProcessingPage />} />
        <Route path="/calls/:callId/*" element={<CallDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/shared/:token" element={<SharedPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
