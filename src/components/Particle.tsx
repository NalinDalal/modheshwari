"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

interface ParticleProps {
  index: number;
  totalParticles: number;
}

const Particle: React.FC<ParticleProps> = ({ index, totalParticles }) => {
  const controls = useAnimation();
  const [color, setColor] = useState("");

  useEffect(() => {
    const hue = (index / totalParticles) * 360;
    setColor(`hsl(${hue}, 100%, 50%)`);

    const animateParticle = async () => {
      while (true) {
        await controls.start({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          transition: { duration: 10 + Math.random() * 20, ease: "linear" },
        });
      }
    };

    animateParticle();
  }, [controls, index, totalParticles]);

  return (
    <motion.div
      animate={controls}
      initial={{
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      }}
      className="absolute w-2.5 h-2.5 rounded-full blur-[3px]"
      style={{ backgroundColor: color }}
    />
  );
};

export default Particle;
