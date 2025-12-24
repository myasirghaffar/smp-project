import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Blog = () => {
  const navigate = useNavigate();

  const articles = [
    {
      id: 1,
      title: "Comment réussir votre profil étudiant sur SkillMatch",
      excerpt: "Découvrez les meilleures pratiques pour créer un profil attractif et décrocher vos premières missions.",
      category: "Guide",
      date: "15 décembre 2024",
      readTime: "5 min",
      image: "/placeholder.svg",
      slug: "reussir-profil-etudiant"
    },
    {
      id: 2,
      title: "Les métiers de demain : quelles compétences développer ?",
      excerpt: "Analyse des compétences les plus recherchées par les entreprises et comment les acquérir pendant vos études.",
      category: "Carrière",
      date: "10 décembre 2024",
      readTime: "8 min",
      image: "/placeholder.svg",
      slug: "metiers-de-demain"
    },
    {
      id: 3,
      title: "Freelance étudiant : comment fixer ses tarifs ?",
      excerpt: "Guide complet pour déterminer vos tarifs horaires en fonction de vos compétences et du marché.",
      category: "Conseils",
      date: "5 décembre 2024",
      readTime: "6 min",
      image: "/placeholder.svg",
      slug: "fixer-ses-tarifs"
    },
    {
      id: 4,
      title: "5 erreurs à éviter lors de votre première mission",
      excerpt: "Les pièges courants que rencontrent les étudiants freelance débutants et comment les éviter.",
      category: "Guide",
      date: "1 décembre 2024",
      readTime: "7 min",
      image: "/placeholder.svg",
      slug: "erreurs-premiere-mission"
    },
    {
      id: 5,
      title: "Témoignage : Comment j'ai financé mes études grâce à SkillMatch",
      excerpt: "Le parcours inspirant d'un étudiant en design graphique qui a réussi à financer ses études via la plateforme.",
      category: "Témoignage",
      date: "28 novembre 2024",
      readTime: "10 min",
      image: "/placeholder.svg",
      slug: "temoignage-financement-etudes"
    },
    {
      id: 6,
      title: "Marketing digital pour étudiants : par où commencer ?",
      excerpt: "Introduction aux bases du marketing digital pour les étudiants souhaitant se lancer dans ce domaine.",
      category: "Formation",
      date: "25 novembre 2024",
      readTime: "12 min",
      image: "/placeholder.svg",
      slug: "marketing-digital-guide"
    }
  ];

  const categories = ["Tous", "Guide", "Carrière", "Conseils", "Témoignage", "Formation"];

  return (
    <>
      <SEO
        title="Blog - Conseils pour étudiants freelance et clients"
        description="Guides, conseils et témoignages pour réussir sur SkillMatch. Apprenez à optimiser votre profil, trouver des missions, fixer vos tarifs et développer vos compétences professionnelles."
        keywords="blog étudiant freelance, conseils freelance, guide étudiant, missions étudiants, compétences professionnelles, tarifs freelance, formation professionnelle"
        url="https://skillmatch.fr/blog"
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-12">
          <div className="container max-w-6xl">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")} 
              className="mb-6"
            >
              ← Retour
            </Button>

            <div className="text-center mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-display font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent"
              >
                Blog SkillMatch
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                Conseils, guides et témoignages pour réussir en tant qu'étudiant freelance
              </motion.p>
            </div>

            {/* Category filters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 justify-center mb-12"
            >
              {categories.map((cat, idx) => (
                <Button
                  key={cat}
                  variant={idx === 0 ? "default" : "outline"}
                  size="sm"
                  className={idx === 0 ? "bg-gradient-primary" : ""}
                >
                  {cat}
                </Button>
              ))}
            </motion.div>

            {/* Articles grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-4 left-4 bg-gradient-primary">
                        {article.category}
                      </Badge>
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {article.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {article.readTime}
                        </span>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription>
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="ghost" 
                        className="group/btn p-0 h-auto font-semibold"
                      >
                        Lire l'article
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Newsletter subscription */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-16"
            >
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Restez informé</CardTitle>
                  <CardDescription>
                    Recevez nos derniers articles et conseils directement dans votre boîte mail
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="votre@email.fr"
                    className="flex-1 px-4 py-2 rounded-lg border bg-background"
                  />
                  <Button className="bg-gradient-primary hover:opacity-90">
                    S'abonner
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Blog;
