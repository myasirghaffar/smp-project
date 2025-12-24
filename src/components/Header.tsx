import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Users, Briefcase, LogOut, User } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const updateScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", updateScroll);
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(255, 255, 255, 0.8)", "rgba(255, 255, 255, 0.95)"]
  );

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "border-border/60 bg-background/95 backdrop-blur-md shadow-md"
          : "border-border/40 bg-background/80 backdrop-blur"
      } supports-[backdrop-filter]:bg-background/60`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <motion.div
            className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <Users className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
            SkillMatch
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/explorer"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Explorer
          </Link>
          {userRole !== "client" && (
            <Link
              to="/missions"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Missions
            </Link>
          )}
          <Link
            to="/faq"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
          {user && (
            <>
              {userRole === "client" && (
                <Link
                  to="/my-missions"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Mes Missions
                </Link>
              )}
              <Link
                to="/dashboard"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                Tableau de bord
              </Link>
              <Link
                to="/messages"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                Messages
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">Mon compte</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {userRole === "student" ? "Étudiant" : "Client"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Tableau de bord</Link>
                </DropdownMenuItem>
                {userRole === "student" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Mon profil</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {userRole === "client" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/my-missions">Mes missions</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Mon profil</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-primary hover:opacity-90 transition-opacity">
                <Link to="/auth?mode=signup">Inscription</Link>
              </Button>
            </>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  SkillMatch
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  to="/explorer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                >
                  Explorer
                </Link>
                {userRole !== "client" && (
                  <Link
                    to="/missions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2 py-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    Missions
                  </Link>
                )}
                <Link
                  to="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                >
                  FAQ
                </Link>
                {user ? (
                  <>
                    {userRole === "client" && (
                      <Link
                        to="/my-missions"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2 py-2"
                      >
                        <Briefcase className="h-4 w-4" />
                        Mes Missions
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      to="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Messages
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2 py-2"
                    >
                      <User className="h-4 w-4" />
                      Mon profil
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="justify-start mt-4"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      Connexion
                    </Link>
                    <Button
                      asChild
                      className="bg-gradient-primary hover:opacity-90 transition-opacity mt-4"
                    >
                      <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                        Inscription
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
