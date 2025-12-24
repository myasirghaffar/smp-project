import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Building } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    description: string;
    budget: number;
    deadline?: string;
    category: string;
    location?: string;
    is_remote: boolean;
    status: string;
  };
  delay?: number;
}

const MissionCard = ({ mission, delay = 0 }: MissionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link to={`/missions/${mission.id}`}>
        <Card className="h-full hover:shadow-elegant transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-xl text-foreground line-clamp-2">
                {mission.title}
              </h3>
              <Badge variant="secondary" className="shrink-0">
                {mission.category}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm line-clamp-3">
              {mission.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{mission.budget} €</span>
              </div>
              
              {mission.deadline && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(mission.deadline), "dd/MM/yyyy")}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {mission.is_remote ? (
                  <>
                    <Building className="h-4 w-4" />
                    <span>Télétravail</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>{mission.location || "Non spécifié"}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button className="w-full bg-gradient-primary hover:opacity-90">
              Voir les détails
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
};

export default MissionCard;