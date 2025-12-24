import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import StudentProfile from "./StudentProfile";
import ClientProfile from "./ClientProfile";
import { Loader2 } from "lucide-react";

const Profile = () => {
  const { userRole, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole === "student") {
    return <StudentProfile />;
  }

  if (userRole === "client") {
    return <ClientProfile />;
  }

  return null;
};

export default Profile;
