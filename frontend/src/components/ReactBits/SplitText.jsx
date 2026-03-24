import { useSprings, animated } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

const SplitText = ({
  text = "",
  className = "",
  delay = 100,
  animationFrom = { opacity: 0, transform: "translate3d(0,40px,0)" },
  animationTo = { opacity: 1, transform: "translate3d(0,0,0)" },
  easing = "easeOutCubic",
  threshold = 0.1,
  rootMargin = "0px",
  textAlign = "center",
  onAnimationComplete,
}) => {
  const words = text.split(" ");
  const [inView, setInView] = useState(false);
  const ref = useRef();
  const animatedCount = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const springs = useSprings(
    words.length,
    words.map((_, i) => ({
      from: animationFrom,
      to: inView
        ? async (next) => {
            await next(animationTo);
            animatedCount.current += 1;
            if (animatedCount.current === words.length && onAnimationComplete) {
              onAnimationComplete();
            }
          }
        : animationFrom,
      delay: i * delay,
      config: { easing },
    }))
  );

  return (
    <p
      ref={ref}
      className={`split-parent ${className}`}
      style={{ textAlign, display: "inline-block", wordBreak: "break-word" }}
    >
      {springs.map((props, index) => (
        <span key={index} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          <animated.span
            style={props}
            className="inline-block transform-gpu"
          >
            {words[index] === "" ? "\u00A0" : words[index]}
          </animated.span>
          &nbsp;
        </span>
      ))}
    </p>
  );
};

export default SplitText;
