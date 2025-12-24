import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({
  title = "SkillMatch Students - Connectez étudiants et opportunités professionnelles",
  description = "La plateforme qui met en relation des étudiants en formation professionnelle (IT, design, photographie, marketing, construction) avec des clients recherchant des services de qualité. Trouvez le talent qu'il vous faut ou des missions adaptées à vos compétences.",
  keywords = "étudiants freelance, missions étudiants, talents étudiants, petits jobs, freelance étudiant, IT étudiant, design étudiant, photographie étudiant, marketing étudiant, construction étudiant, coiffure étudiant, comptabilité étudiant, plateforme freelance étudiants",
  image = "/og-image.jpg",
  url = "https://skillmatch.fr",
  type = "website"
}: SEOProps) => {
  const siteTitle = title.includes("SkillMatch") ? title : `${title} | SkillMatch Students`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="SkillMatch Students" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="French" />
      <meta name="author" content="SkillMatch Students" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
