import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import getProfile from "../../services/getProfile";

function ProfileAbout() {
  const { state } = useLocation();
  const [profile, setProfile] = useState(state || {});
  const { bio } = profile;
  const { headers } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (state && state.bio === bio) return;

    getProfile({ headers, username })
      .then(setProfile)
      .catch((error) => {
        console.error(error);
        navigate("/not-found", { replace: true });
      });
  }, [username, headers, state, navigate, bio]);

  return (
    <div className="col-xs-12 col-md-10 offset-md-1">
      <div className="article-preview">
        {bio ? (
          <Markdown options={{ forceBlock: true }}>{bio}</Markdown>
        ) : (
          <em>No bio provided.</em>
        )}
      </div>
    </div>
  );
}

export default ProfileAbout;
