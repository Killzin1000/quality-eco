import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phone = "5511987654321"; // Número de telefone (incluir código do país)
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre os cursos da Quality Educacional.");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#20BA5A] text-white z-50 animate-pulse hover:animate-none"
    >
      <MessageCircle className="h-7 w-7" />
    </Button>
  );
};
