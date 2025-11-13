import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, MapPin } from "lucide-react";

interface CourseCardProps {
  curso: {
    id: number;
    "Nome dos cursos": string | null;
    Tipo: string | null;
    Modalidade: string | null;
    "Carga Horária": string | null;
    "Preço Pix / Valor para Cadastro": string | null;
    "Preço Cartão / Valor para Cadastro": string | null;
    ImagemCapa: string | null;
    Polo: string | null;
  };
}

export const CourseCard = ({ curso }: CourseCardProps) => {
  const getLowestPrice = () => {
    const pix = curso["Preço Pix / Valor para Cadastro"];
    const cartao = curso["Preço Cartão / Valor para Cadastro"];
    
    if (!pix && !cartao) return null;
    if (!pix) return cartao;
    if (!cartao) return pix;
    
    // Tentar converter para número e comparar
    const pixNum = parseFloat(pix.replace(/[^\d,]/g, '').replace(',', '.'));
    const cartaoNum = parseFloat(cartao.replace(/[^\d,]/g, '').replace(',', '.'));
    
    return pixNum < cartaoNum ? pix : cartao;
  };

  const price = getLowestPrice();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <Link to={`/curso/${curso.id}`} className="flex-1 flex flex-col">
        <div className="relative overflow-hidden aspect-video bg-muted">
          {curso.ImagemCapa ? (
            <img
              src={curso.ImagemCapa}
              alt={curso["Nome dos cursos"] || "Curso"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-glow">
              <BookOpen className="h-16 w-16 text-primary-foreground/50" />
            </div>
          )}
          {curso.Modalidade && (
            <Badge 
              className="absolute top-3 right-3" 
              variant={curso.Modalidade === "EaD" ? "default" : "secondary"}
            >
              {curso.Modalidade}
            </Badge>
          )}
        </div>

        <CardContent className="flex-1 p-4">
          {curso.Tipo && (
            <p className="text-xs text-accent font-semibold uppercase mb-2">{curso.Tipo}</p>
          )}
          <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-smooth">
            {curso["Nome dos cursos"] || "Curso sem título"}
          </h3>
          
          <div className="space-y-2">
            {curso["Carga Horária"] && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>{curso["Carga Horária"]}</span>
              </div>
            )}
            {curso.Polo && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="line-clamp-1">{curso.Polo}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          {price ? (
            <div>
              <p className="text-xs text-muted-foreground">A partir de</p>
              <p className="text-2xl font-bold text-primary">{price}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Consulte valores</p>
          )}
          <Button size="sm" variant="default" className="group-hover:bg-accent group-hover:text-accent-foreground transition-smooth">
            Ver mais
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
};
