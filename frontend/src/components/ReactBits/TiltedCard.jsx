import { useRef, useState } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

const TiltedCard = ({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerClassName = "",
  imageClassName = "",
  captionClassName = "",
  rotateX = 15,
  rotateY = 15,
  scale = 1.05,
  showMobileWarning = true,
  showTooltip = true,
  displayOverlayContent = false,
  overlayContent = null,
}) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXSpring = useSpring(useTransform(y, [-0.5, 0.5], [`${rotateX}deg`, `-${rotateX}deg`]));
  const rotateYSpring = useSpring(useTransform(x, [-0.5, 0.5], [`-${rotateY}deg`, `${rotateY}deg`]));

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
    setMousePosition({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full perspective-1000 ${containerClassName}`}
    >
      <motion.div
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale }}
        className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl transition-shadow duration-500 hover:shadow-indigo-500/20"
      >
        <img
          src={imageSrc}
          alt={altText}
          className={`w-full h-full object-cover transition-transform duration-500 ${imageClassName}`}
        />

        {displayOverlayContent && overlayContent && (
          <div className="absolute inset-0 pointer-events-none transform-gpu translate-z-20">
            {overlayContent}
          </div>
        )}

        {showTooltip && (
          <motion.div
            style={{
              x: mousePosition.x,
              y: mousePosition.y,
              translateX: "-50%",
              translateY: "-50%",
              zIndex: 50,
            }}
            className="absolute top-0 left-0 pointer-events-none bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/20 whitespace-nowrap"
          >
            {captionText}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TiltedCard;
