import { motion } from "framer-motion";
import { Search, MessageCircle, CheckCircle, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Trouvez le talent parfait",
    description: "Parcourez des profils vérifiés d'étudiants qualifiés dans votre domaine",
  },
  {
    icon: MessageCircle,
    title: "Contactez directement",
    description: "Discutez de votre projet et obtenez des devis personnalisés",
  },
  {
    icon: CheckCircle,
    title: "Collaborez en confiance",
    description: "Paiement sécurisé et suivi de projet transparent",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-secondary backdrop-blur-sm border border-secondary/20 text-white text-sm font-semibold mb-6 shadow-colored"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            Simple et efficace
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl md:text-5xl font-display font-bold mb-6"
          >
            Comment{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              ça marche ?
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            En quelques clics, trouvez l'étudiant idéal pour votre projet
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connection lines between steps */}
          <div className="hidden md:block absolute top-[120px] left-[20%] right-[20%] h-1">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full origin-left"
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative group"
            >
              <div className="relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border-2 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-colored">
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500"
                  whileHover={{ scale: 1.05 }}
                />

                <div className="text-center space-y-6 relative">
                  {/* Icon with animation */}
                  <motion.div
                    className="relative inline-block"
                    whileHover={{ y: -10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-40"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    
                    {/* Icon container */}
                    <motion.div
                      className="relative h-24 w-24 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto shadow-xl"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <step.icon className="h-12 w-12 text-white" />
                    </motion.div>
                    
                    {/* Step number badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 + 0.4, type: "spring", stiffness: 500 }}
                      className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-gradient-secondary text-white flex items-center justify-center text-lg font-bold shadow-lg"
                    >
                      {index + 1}
                    </motion.div>
                  </motion.div>
                  
                  {/* Text content */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-display font-bold group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <motion.a
            href="/explorer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-full font-semibold text-lg shadow-colored hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Commencer maintenant
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
