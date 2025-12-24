import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PortfolioUploadProps {
  currentImages: string[];
  onImagesChange: (images: string[]) => void;
}

const PortfolioUpload = ({ currentImages, onImagesChange }: PortfolioUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const files = Array.from(event.target.files);
      
      // Validate number of images
      if (currentImages.length + files.length > 10) {
        toast.error("Vous ne pouvez pas ajouter plus de 10 images");
        return;
      }

      if (!user) {
        toast.error("Vous devez être connecté");
        setUploading(false);
        return;
      }

      setUploading(true);

      const uploadPromises = files.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} n'est pas une image`);
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} dépasse 10 MB`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...currentImages, ...uploadedUrls];

      // Wait a bit before updating to ensure DOM is stable
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update local state - parent component will handle database update
      onImagesChange(newImages);
      toast.success(`${uploadedUrls.length} image(s) ajoutée(s) !`);
    } catch (error: any) {
      console.error('Error uploading portfolio:', error);
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      // Ensure uploading state is reset after a delay to prevent DOM conflicts
      setTimeout(() => setUploading(false), 150);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      if (!user) return;

      const newImages = currentImages.filter(img => img !== imageUrl);

      // Extract file path from URL
      const urlParts = imageUrl.split('/portfolio/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        
        // Delete from storage
        await supabase.storage
          .from('portfolio')
          .remove([filePath]);
      }

      // Update local state - parent will handle database update
      onImagesChange(newImages);
      toast.success("Image supprimée");
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Portfolio ({currentImages.length}/10)</Label>
        {currentImages.length < 10 && (
          <div>
            <input
              type="file"
              id="portfolio-upload"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.getElementById('portfolio-upload');
                if (input && !uploading) {
                  input.click();
                }
              }}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Upload...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  <span>Ajouter des images</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {currentImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Portfolio ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => handleRemoveImage(imageUrl)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
          <ImagePlus className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucune image dans votre portfolio
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        JPG, PNG ou WEBP. Max 10 MB par image. Maximum 10 images.
      </p>
    </div>
  );
};

export default PortfolioUpload;
