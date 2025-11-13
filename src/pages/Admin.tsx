import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      const { data, error } = await supabase.from("cursos").select("*").order("id", { ascending: false });
      if (error) throw error;
      setCursos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar cursos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Curso
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cursos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell>{curso.id}</TableCell>
                      <TableCell className="font-medium">{curso["Nome dos cursos"]}</TableCell>
                      <TableCell>
                        <Badge variant={curso.Modalidade === "EaD" ? "default" : "secondary"}>
                          {curso.Modalidade}
                        </Badge>
                      </TableCell>
                      <TableCell>{curso.Tipo}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
