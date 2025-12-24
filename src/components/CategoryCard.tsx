import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  gradient: string;
  delay?: number;
}

const CategoryCard = ({ icon: Icon, title, gradient, delay = 0 }: CategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <Link to="/explorer">
        <Card className="group relative overflow-hidden p-8 hover:shadow-colored transition-all duration-500 cursor-pointer border-2 hover:border-primary/50 hover:scale-105 bg-card/50 backdrop-blur-sm">
          {/* Animated gradient background on hover */}
          <motion.div 
            className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
            initial={false}
          />
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          
          <div className="relative space-y-4">
            <motion.div 
              className={`h-14 w-14 rounded-2xl ${gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
              whileHover={{ rotate: 12, scale: 1.15 }}
            >
              <Icon className="h-7 w-7" />
            </motion.div>
            
            <div>
              <h3 className="text-xl font-display font-semibold group-hover:text-primary transition-colors duration-300">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Découvrir →
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
