import { cn } from "../../utils/cn";

const ShinyText = ({ text, disabled = false, speed = 5, className = "" }) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={cn(
        "bg-clip-text font-black tracking-tight select-none inline-block",
        disabled ? "text-white" : "animate-shiny-text",
        className
      )}
      style={{
        background: "linear-gradient(120deg, #ffffff 30%, #a5b4fc 50%, #ffffff 70%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        animationDuration: animationDuration,
      }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
