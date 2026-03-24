import { forwardRef, useMemo, useRef, useEffect, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../utils/cn';

const VariableProximity = forwardRef(
  (
    {
      label,
      fromFontVariationSettings,
      toFontVariationSettings,
      containerRef,
      radius = 150,
      falloff = 'linear',
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const letterRefs = useRef([]);
    const mouseX = useMotionValue(Infinity);
    const mouseY = useMotionValue(Infinity);

    const checkDistance = (x, y, letterRect) => {
      const letterCenterX = letterRect.left + letterRect.width / 2;
      const letterCenterY = letterRect.top + letterRect.height / 2;
      const distance = Math.sqrt(Math.pow(x - letterCenterX, 2) + Math.pow(y - letterCenterY, 2));
      return distance;
    };

    useEffect(() => {
      const handleMouseMove = (e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      };

      const handleTouchMove = (e) => {
        mouseX.set(e.touches[0].clientX);
        mouseY.set(e.touches[0].clientY);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchstart', handleTouchMove);
      window.addEventListener('touchmove', handleTouchMove);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchstart', handleTouchMove);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }, [mouseX, mouseY]);

    const letters = useMemo(() => label.split(''), [label]);

    return (
      <span
        ref={ref}
        className={cn('inline-block', className)}
        onClick={onClick}
        style={{ display: 'inline-flex', flexWrap: 'wrap' }}
        {...props}
      >
        {letters.map((letter, index) => (
          <Letter
            key={index}
            letter={letter}
            ref={(el) => (letterRefs.current[index] = el)}
            mouseX={mouseX}
            mouseY={mouseY}
            fromFontVariationSettings={fromFontVariationSettings}
            toFontVariationSettings={toFontVariationSettings}
            radius={radius}
            falloff={falloff}
          />
        ))}
      </span>
    );
  }
);

VariableProximity.displayName = 'VariableProximity';

const Letter = forwardRef(
  (
    {
      letter,
      mouseX,
      mouseY,
      fromFontVariationSettings,
      toFontVariationSettings,
      radius,
      falloff,
    },
    ref
  ) => {
    const internalRef = useRef(null);

    const fontVariationSettings = useMotionValue(fromFontVariationSettings);
    const springConfig = { damping: 20, stiffness: 200 };
    const springSettings = useSpring(fontVariationSettings, springConfig);

    useAnimationFrame(() => {
      if (!internalRef.current) return;
      const rect = internalRef.current.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(mouseX.get() - (rect.left + rect.width / 2), 2) +
          Math.pow(mouseY.get() - (rect.top + rect.height / 2), 2)
      );

      let proximityTransition = 0;
      if (distance < radius) {
        if (falloff === 'linear') {
          proximityTransition = 1 - distance / radius;
        } else if (falloff === 'exponential') {
          proximityTransition = Math.exp(-distance / (radius / 2));
        } else if (falloff === 'gaussian') {
          proximityTransition = Math.exp(-Math.pow(distance / (radius / 2), 2));
        }
      }

      // This is a simplified version since calculating complex font-variation-settings is hard in a generic way
      // For now, we'll just interpolate weights if they are provided
      const parseSettings = (settings) => {
        const match = settings.match(/'wght'\s+(\d+)/);
        return match ? parseInt(match[1]) : 400;
      };

      const fromWeight = parseSettings(fromFontVariationSettings);
      const toWeight = parseSettings(toFontVariationSettings);
      const currentWeight = fromWeight + (toWeight - fromWeight) * proximityTransition;

      internalRef.current.style.fontVariationSettings = `'wght' ${currentWeight}`;
    });

    return (
      <span
        ref={(el) => {
          internalRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        className="inline-block transition-all duration-75 ease-out"
        style={{
          fontVariationSettings: fromFontVariationSettings,
          transition: 'font-variation-settings 0.1s ease-out',
        }}
      >
        {letter === ' ' ? '\u00A0' : letter}
      </span>
    );
  }
);

Letter.displayName = 'Letter';

export default VariableProximity;
