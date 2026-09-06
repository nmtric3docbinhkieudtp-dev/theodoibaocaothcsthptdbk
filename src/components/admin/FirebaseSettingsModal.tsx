import React, { useState } from 'react';
import { useReports } from '../../context/ReportContext';
import { 
  Database, 
  Github, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  School, 
  Save, 
  ExternalLink,
  ShieldCheck,
  Server,
  Image as ImageIcon
} from 'lucide-react';
import { FirebaseConfig, SchoolInfo } from '../../types';

interface FirebaseSettingsModalProps {
  onOpenLogoModal?: () => void;
}

export const FirebaseSettingsModal: React.FC<FirebaseSettingsModalProps> = ({ onOpenLogoModal }) => {
  const { 
    firebaseConfig, 
    updateFirebaseConfig, 
    syncToFirebase, 
    syncFromFirebase, 
    testFirebase,
    schoolInfo,
    updateSchoolInfo,
    resetAllData
  } = useReports();

  // Local Form state
  const [apiKey, setApiKey] = useState(firebaseConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [projectId, setProjectId] = useState(firebaseConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(firebaseConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(firebaseConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(firebaseConfig.appId || '');

  // School info edit state
  const [schoolForm, setSchoolForm] = useState<SchoolInfo>(schoolInfo);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    updateFirebaseConfig({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    });
    alert('Đã lưu cấu hình Firebase thành công!');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testFirebase();
    setTestResult(res);
    setTesting(false);
  };

  const handleSyncUp = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await syncToFirebase();
    setSyncResult(res.message);
    setSyncing(false);
  };

  const handleSyncDown = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await syncFromFirebase();
    setSyncResult(res.message);
    setSyncing(false);
  };

  const handleSaveSchoolInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolInfo(schoolForm);
    alert('Đã cập nhật thông tin nhà trường thành công!');
  };

  const envSample = `VITE_FIREBASE_API_KEY=${apiKey || 'AIzaSy...'}\nVITE_FIREBASE_AUTH_DOMAIN=${authDomain || `${projectId || 'docbinhkieu-reports'}.firebaseapp.com`}\nVITE_FIREBASE_PROJECT_ID=${projectId || 'docbinhkieu-reports'}\nVITE_FIREBASE_STORAGE_BUCKET=${storageBucket || `${projectId || 'docbinhkieu-reports'}.appspot.com`}\nVITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId || '123456789'}\nVITE_FIREBASE_APP_ID=${appId || '1:123456789:web:abcdef'}`;

  const copyEnvToClipboard = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-emerald-600" />
          <span>Cấu Hình Firebase Backend & Triển Khai Vercel / GitHub</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý kết nối cơ sở dữ liệu đám mây Firestore, thiết lập deploy và thông tin nhà trường
        </p>
      </div>

      {/* Grid: Firebase Config & Vercel Deploy Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Firebase Config Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Thông tin kết nối Firebase Firestore</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              firebaseConfig.isConfigured ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {firebaseConfig.isConfigured ? '● Đang kích hoạt' : 'Local Storage Fallback'}
            </span>
          </div>

          <form onSubmit={handleSaveFirebase} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Firebase Project ID:</label>
              <input
                type="text"
                placeholder="docbinhkieu-reports"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">API Key:</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Auth Domain:</label>
                <input
                  type="text"
                  placeholder="project-id.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Bucket:</label>
                <input
                  type="text"
                  placeholder="project-id.appspot.com"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cấu Hình</span>
              </button>

              <button
                type="button"
                disabled={testing}
                onClick={handleTestConnection}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra Firestore'}</span>
              </button>
            </div>
          </form>

          {/* Test connection alert */}
          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              testResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Cloud Sync Actions */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-xs font-bold text-slate-700">Đồng bộ dữ liệu hai chiều:</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncUp}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Đồng bộ toàn bộ lên Firebase</span>
              </button>

              <button
                type="button"
                disabled={syncing}
                onClick={handleSyncDown}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kéo dữ liệu từ Firebase về</span>
              </button>
            </div>

            {syncResult && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {syncResult}
              </div>
            )}
          </div>
        </div>

        {/* Deploy to GitHub & Vercel Guide */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Hướng dẫn Publish lên GitHub & Vercel.app</span>
          </div>

          <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Github className="w-4 h-4 text-slate-900" />
                <span>Bước 1: Kết nối GitHub Repo</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Xuất mã nguồn ứng dụng qua nút Settings góc phải trên AI Studio, hoặc đẩy mã nguồn lên Repository GitHub của trường.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Bước 2: Import vào Vercel (vercel.app)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                • Truy cập <strong>vercel.com/new</strong> &gt; Import GitHub Repository.<br />
                • Framework Preset: <strong>Vite</strong>.<br />
                • Root Directory: <code>./</code> (Đã có sẵn file <code>vercel.json</code> cấu hình SPA rewrites).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Bước 3: Biến môi trường trên Vercel</span>
                <button
                  type="button"
                  onClick={copyEnvToClipboard}
                  className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Đã sao chép!' : 'Copy cấu hình .env'}</span>
                </button>
              </div>
              <pre className="p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto">
                {envSample}
              </pre>
            </div>
          </div>
        </div>

      </div>

      {/* School Information Editor & Logo */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              {schoolInfo.logoUrl ? (
                <img src={schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <School className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span>Biểu trưng & Thông tin Nhà trường</span>
              </div>
              <p className="text-xs text-slate-500">Logo và thông tin chính thức của trường</p>
            </div>
          </div>

          {onOpenLogoModal && (
            <button
              type="button"
              onClick={onOpenLogoModal}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>Thay Đổi / Cập Nhật Logo</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveSchoolInfo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên trường đầy đủ:</label>
            <input
              type="text"
              value={schoolForm.formalName}
              onChange={(e) => setSchoolForm({ ...schoolForm, formalName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cơ quan chủ quản:</label>
            <input
              type="text"
              value={schoolForm.departmentOfEducation}
              onChange={(e) => setSchoolForm({ ...schoolForm, departmentOfEducation: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Địa chỉ trường:</label>
            <input
              type="text"
              value={schoolForm.address}
              onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email trường:</label>
            <input
              type="text"
              value={schoolForm.email}
              onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Hiệu trưởng:</label>
            <input
              type="text"
              value={schoolForm.principalName}
              onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Điện thoại liên hệ:</label>
            <input
              type="text"
              value={schoolForm.phone}
              onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có muốn khôi phục lại dữ liệu mẫu gốc ban đầu không?')) {
                  resetAllData();
                  alert('Đã khôi phục dữ liệu mẫu chuẩn thành công!');
                }
              }}
              className="text-xs text-rose-600 hover:underline cursor-pointer"
            >
              Khôi phục dữ liệu mẫu ban đầu
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Cập Nhật Thông Tin Trường</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
