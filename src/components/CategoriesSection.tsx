import { ChefHat, Palette, Camera, TrendingUp, Wrench, Scissors } from "lucide-react";
import { motion } from "framer-motion";
import CategoryCard from "./CategoryCard";

const categories = [
  {
    icon: ChefHat,
    title: "Cuisine",
    gradient: "bg-gradient-primary",
  },
  {
    icon: Palette,
    title: "Design & Graphisme",
    gradient: "bg-gradient-secondary",
  },
  {
    icon: Camera,
    title: "Photo & Vidéo",
    gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Marketing",
    gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
  },
  {
    icon: Wrench,
    title: "Bâtiment & Travaux",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
  {
    icon: Scissors,
    title: "Coiffure & Beauté",
    gradient: "bg-gradient-to-br from-rose-500 to-pink-500",
  },
];

const CategoriesSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" />
      
      <div className="container relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
              Catégories populaires
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Parcourez par catégorie
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Des milliers d'étudiants talentueux dans tous les domaines, prêts à réaliser vos projets
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.title}
              {...category}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
