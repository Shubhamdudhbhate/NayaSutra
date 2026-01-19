import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminWalletManagement from "@/components/admin/AdminWalletManagement";
import { AlertCircle } from "lucide-react";

const AdminWalletPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Check if user is judiciary (admin access)
  if (
    !profile ||
    profile.role_category !== "judiciary"
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-600 mb-6">
            This page is only accessible to administrators.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <AdminWalletManagement />;
};

export default AdminWalletPage;
