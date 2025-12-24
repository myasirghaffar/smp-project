import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-students-professions.png";
import FloatingElements from "./FloatingElements";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Floating animated elements */}
      <FloatingElements />
      
      {/* Animated background mesh gradient */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 animate-float" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-accent backdrop-blur-sm border border-primary/20 shadow-colored"
            >
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
              <span className="text-sm font-medium text-white">Plateforme #1 pour étudiants freelances</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight"
            >
              Nos{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-primary bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  étudiants
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-primary rounded-full"
                />
              </span>{" "}
              ont du talent
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed"
            >
              Connectez vos{" "}
              <span className="text-foreground font-semibold">compétences</span> avec des opportunités.
              SkillMatch Students relie les étudiants talentueux avec des clients recherchant des prestations de qualité.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button 
                size="lg" 
                asChild 
                className="group bg-gradient-primary hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-colored text-lg px-8"
              >
                <Link to="/explorer" className="flex items-center gap-2">
                  Trouver un étudiant
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="group border-2 hover:bg-muted/50 hover:scale-105 transition-all duration-300 text-lg px-8"
              >
                <Link to="/auth?mode=signup&type=student" className="flex items-center gap-2">
                  Devenir freelance étudiant
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Link>
              </Button>
            </motion.div>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative max-w-md mx-auto lg:mx-0 lg:ml-8"
          >
            {/* Animated glow effect */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl -z-10"
            />
            
            {/* Image container with border and shadow */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 shadow-xl hover:shadow-colored transition-all duration-500 hover:scale-[1.02]">
              <img
                src={heroImage}
                alt="Étudiants collaborant sur des projets"
                className="w-full h-auto"
              />
              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
