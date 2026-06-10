import { useFeedContext } from "../../context/FeedContext";

function TagButton({ tagsList }) {
  const { changeTab } = useFeedContext();

  const handleClick = (e) => {
    changeTab(e, "tag");
  };

  return tagsList.slice(0, 50).map((name, idx) => (
    <button
      className={"tag-pill tag-default" + (idx < 5 ? " tag-hot" : "")}
      key={name}
      onClick={handleClick}
    >
      {idx < 5 && <i className="ion-flame"></i>} {name}
    </button>
  ));
}

export default TagButton;
