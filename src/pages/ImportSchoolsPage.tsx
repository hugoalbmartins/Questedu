import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ImportSchoolsPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stats, setStats] = useState<{ parsed: number; inserted: number; errors: number } | null>(null);

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione o ficheiro CSV");
      return;
    }

    setImporting(true);
    setProgress(0);
    setStats(null);

    try {
      setStatus("A ler ficheiro CSV...");
      setProgress(10);
      const csvText = await file.text();

      setStatus("A enviar para o servidor (parsing + inserção)...");
      setProgress(30);

      // Single call: send full CSV to edge function
      const { data, error } = await supabase.functions.invoke('import-schools-temp', {
        body: { action: 'import_csv', csvText },
      });

      if (error) {
        console.error('Import error:', error);
        toast.error(`Erro na importação: ${error.message}`);
        setStatus(`Erro: ${error.message}`);
        return;
      }

      setProgress(100);
      const result = data as { success: boolean; parsed: number; inserted: number; errors: number; error?: string };

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        setStatus(`Erro: ${result.error}`);
        return;
      }

      setStats({ parsed: result.parsed, inserted: result.inserted, errors: result.errors });

      if (result.errors === 0) {
        toast.success(`✅ Importadas ${result.inserted} escolas com sucesso!`);
        setStatus("Importação concluída com sucesso!");
      } else {
        toast.warning(`Importadas ${result.inserted} escolas, ${result.errors} erros`);
        setStatus(`Importação concluída: ${result.inserted} ok, ${result.errors} erros`);
      }

    } catch (error: any) {
      toast.error("Erro na importação");
      setStatus(`Erro: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar Escolas do 1º Ciclo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ficheiro CSV (RedeEscolas)</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm border rounded p-2"
                disabled={importing}
              />
            </div>

            <Button onClick={handleImport} disabled={importing || !file} className="w-full">
              {importing ? 'A importar...' : 'Importar Escolas'}
            </Button>

            {importing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">{status}</p>
              </div>
            )}

            {stats && !importing && (
              <div className="p-4 bg-muted rounded-lg space-y-1">
                <p className="font-medium">{status}</p>
                <p className="text-sm">Escolas encontradas no CSV: {stats.parsed}</p>
                <p className="text-sm text-primary">Inseridas: {stats.inserted}</p>
                {stats.errors > 0 && (
                  <p className="text-sm text-destructive">Erros: {stats.errors}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
