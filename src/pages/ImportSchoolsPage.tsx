import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SchoolData {
  name: string;
  district: string;
  municipality: string | null;
  locality: string | null;
}

export default function ImportSchoolsPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const parseCSV = (text: string): SchoolData[] => {
    const lines = text.split('\n');
    const schools: SchoolData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Parse CSV with quoted fields
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());
      
      // Indexes: CODIGO(0),NOME(1),...,LOCALIDADE(6),CONCELHO(7),DISTRITO(8),...,CICLO(13)
      const ciclo = fields[13] || '';
      
      if (ciclo.includes('1º Ciclo')) {
        const name = fields[1]?.trim();
        const locality = fields[6]?.trim() || null;
        const municipality = fields[7]?.trim() || null;
        const district = fields[8]?.trim() || null;
        
        if (name && district) {
          schools.push({ name, district, municipality, locality });
        }
      }
    }
    
    return schools;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione o ficheiro CSV");
      return;
    }

    setImporting(true);
    setResult("");

    try {
      const text = await file.text();
      const schools = parseCSV(text);
      
      setResult(`Encontradas ${schools.length} escolas com 1º Ciclo. A importar...`);

      const { data, error } = await supabase.functions.invoke('import-schools-temp', {
        body: { schools },
      });

      if (error) {
        toast.error(`Erro: ${error.message}`);
        setResult(`Erro: ${error.message}`);
      } else {
        toast.success(`Importadas ${data.totalInserted} escolas!`);
        setResult(`✅ Importadas ${data.totalInserted} escolas com sucesso!`);
      }
    } catch (error: any) {
      toast.error("Erro na importação");
      setResult(`Erro: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Importar Escolas do 1º Ciclo</h1>
        
        <div>
          <label className="block text-sm font-medium mb-2">Ficheiro CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm border rounded p-2"
          />
        </div>

        <Button onClick={handleImport} disabled={importing || !file} className="w-full">
          {importing ? 'A importar...' : 'Importar Escolas'}
        </Button>

        {result && (
          <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">{result}</div>
        )}
      </div>
    </div>
  );
}
