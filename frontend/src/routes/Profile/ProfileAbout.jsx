import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import getProfile from "../../services/getProfile";
import userUpdate from "../../services/userUpdate";

function ProfileAbout() {
  const { username } = useParams();
  const { headers, loggedUser, setAuthState } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bioText, setBioText] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwnProfile = loggedUser.username === username;

  useEffect(() => {
    setLoading(true);
    getProfile({ headers, username })
      .then((data) => {
        setProfile(data);
        setBioText(data.bio || "");
      })
      .catch((error) => {
        console.error(error);
        navigate("/not-found", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [username, headers, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await userUpdate({
        headers,
        bio: bioText,
        email: loggedUser.email,
        image: loggedUser.image,
        username: loggedUser.username,
      });
      setAuthState(result);
      setProfile((prev) => ({ ...prev, bio: bioText }));
      setEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="article-preview"><em>Loading about...</em></div>;
  }

  return (
    <div className="article-preview">
      {!editing ? (
        <>
          {profile.bio ? (
            <Markdown options={{ forceBlock: true }}>{profile.bio}</Markdown>
          ) : (
            <p className="text-muted">No bio yet.</p>
          )}
          {isOwnProfile && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setEditing(true)}
            >
              <i className="ion-edit"></i> Edit Bio
            </button>
          )}
        </>
      ) : (
        <div>
          <fieldset className="form-group">
            <textarea
              className="form-control form-control-lg"
              rows="6"
              placeholder="Write something about yourself..."
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
            ></textarea>
          </fieldset>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {" "}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setBioText(profile.bio || "");
              setEditing(false);
            }}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileAbout;
