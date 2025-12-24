import { motion } from "framer-motion";

const FloatingElements = () => {
  const shapes = [
    { size: 60, color: "hsl(var(--primary))", delay: 0, duration: 20 },
    { size: 40, color: "hsl(var(--secondary))", delay: 2, duration: 15 },
    { size: 80, color: "hsl(var(--primary))", delay: 4, duration: 25 },
    { size: 50, color: "hsl(var(--secondary))", delay: 1, duration: 18 },
    { size: 70, color: "hsl(271 91% 65%)", delay: 3, duration: 22 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: shape.size,
            height: shape.size,
            background: `radial-gradient(circle, ${shape.color} 0%, transparent 70%)`,
            left: `${(index * 25) % 100}%`,
            top: `${(index * 35) % 100}%`,
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.2, 0.3, 0.15, 0.2],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Sparkle effects */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-2 h-2 bg-primary rounded-full"
          style={{
            left: `${(i * 15 + 10) % 90}%`,
            top: `${(i * 20 + 15) % 80}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default FloatingElements;
