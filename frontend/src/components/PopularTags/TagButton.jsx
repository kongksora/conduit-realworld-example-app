import { useFeedContext } from "../../context/FeedContext";

function TagButton({ tagsList }) {
  const { changeTab } = useFeedContext();

  const handleClick = (e) => {
    changeTab(e, "tag");
  };

  return tagsList.slice(0, 50).map((name, idx) => (
    <button
      className={`tag-pill tag-default${idx < 5 ? " tag-popular" : ""}`}
      key={name}
      onClick={handleClick}
    >
      {name}
    </button>
  ));
}

export default TagButton;
