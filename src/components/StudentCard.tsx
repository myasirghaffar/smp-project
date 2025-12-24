import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface StudentCardProps {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  skills: string[];
  rating: number;
  hourlyRate: number;
  location: string;
  availability: string;
  delay?: number;
}

const StudentCard = ({
  id,
  name,
  avatar,
  title,
  skills,
  rating,
  hourlyRate,
  location,
  availability,
  delay = 0,
}: StudentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link to={`/profile/${id}`}>
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/30">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                    {name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-sm font-medium">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span>{rating}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skills.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{availability}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-display font-bold text-primary">
                  {hourlyRate}€
                </div>
                <div className="text-xs text-muted-foreground">/ heure</div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default StudentCard;
