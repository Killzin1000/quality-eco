import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Users, Award, TrendingUp } from "lucide-react";

interface Curso {
  id: number;
  nome: string;
  total_visualizacoes: number;
  visitantes_unicos: number;
  tempo_medio_segundos: number;
  total_matriculas: number;
  taxa_conversao: number;
}

interface TopCoursesProps {
  cursos: Curso[];
}

export const TopCourses = ({ cursos }: TopCoursesProps) => {
  const maxViews = Math.max(...cursos.map((c) => c.total_visualizacoes), 1);

  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    return `${minutos}min`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Cursos por Engajamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {cursos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado disponível ainda
            </p>
          ) : (
            cursos.map((curso, index) => (
              <div key={curso.id} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="shrink-0">
                        #{index + 1}
                      </Badge>
                      <h4 className="font-medium truncate">{curso.nome}</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {curso.total_visualizacoes} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {curso.visitantes_unicos} únicos
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {curso.total_matriculas} matrículas
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {curso.taxa_conversao?.toFixed(1) || 0}% conversão
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-primary">
                      {formatarTempo(curso.tempo_medio_segundos)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      tempo médio
                    </div>
                  </div>
                </div>
                <Progress
                  value={(curso.total_visualizacoes / maxViews) * 100}
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
