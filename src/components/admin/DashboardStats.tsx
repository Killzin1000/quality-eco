import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, ShoppingCart, TrendingUp, Clock, Award } from "lucide-react";

interface StatsProps {
  totalVisualizacoes: number;
  visitantesUnicos: number;
  totalMatriculas: number;
  taxaConversao: number;
  tempoMedioSessao: number;
  carrinhoAbandonado: number;
}

export const DashboardStats = ({
  totalVisualizacoes,
  visitantesUnicos,
  totalMatriculas,
  taxaConversao,
  tempoMedioSessao,
  carrinhoAbandonado,
}: StatsProps) => {
  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  };

  const stats = [
    {
      title: "Total de Visualizações",
      value: totalVisualizacoes.toLocaleString(),
      icon: Eye,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Visitantes Únicos",
      value: visitantesUnicos.toLocaleString(),
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Matrículas",
      value: totalMatriculas.toLocaleString(),
      icon: Award,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Taxa de Conversão",
      value: `${taxaConversao.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Tempo Médio de Sessão",
      value: formatarTempo(tempoMedioSessao),
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Carrinhos Abandonados",
      value: carrinhoAbandonado.toLocaleString(),
      icon: ShoppingCart,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
