import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-lg">QE</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Quality Educacional</h3>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Transformando vidas através da educação de qualidade.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-semibold mb-4">Cursos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/cursos?modalidade=EaD" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Cursos EaD
                </Link>
              </li>
              <li>
                <Link to="/cursos?modalidade=Presencial" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Cursos Presenciais
                </Link>
              </li>
              <li>
                <Link to="/cursos?tipo=Licenciatura" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Licenciaturas
                </Link>
              </li>
              <li>
                <Link to="/cursos?tipo=Pós-Graduação" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Pós-Graduação
                </Link>
              </li>
            </ul>
          </div>

          {/* Informações */}
          <div>
            <h4 className="font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Termos de Uso
                </a>
              </li>
              <li>
                <Link to="/admin" className="text-sm text-primary-foreground/80 hover:text-accent transition-smooth">
                  Área Administrativa
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <Phone className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm text-primary-foreground/80">(11) 98765-4321</span>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm text-primary-foreground/80">contato@qualityedu.com.br</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-sm text-primary-foreground/80">São Paulo, SP</span>
              </li>
            </ul>

            {/* Redes Sociais */}
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-accent transition-smooth">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} Quality Educacional. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
