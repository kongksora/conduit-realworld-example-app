import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import getProfile from "../../services/getProfile";

function ProfileAbout() {
  const [{ bio }, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const { headers } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    getProfile({ headers, username })
      .then((profile) => {
        setProfile(profile);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        navigate("/not-found", { replace: true });
      });
  }, [headers, username, navigate]);

  if (loading) {
    return <div className="article-preview">Loading...</div>;
  }

  return (
    <div className="article-preview">
      {bio ? (
        <Markdown options={{ forceBlock: true }}>{bio}</Markdown>
      ) : (
        <em>This user hasn&apos;t written a bio yet.</em>
      )}
    </div>
  );
}

export default ProfileAbout;
