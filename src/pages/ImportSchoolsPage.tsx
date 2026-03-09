import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SchoolData {
  name: string;
  district: string;
  municipality: string;
  locality: string;
}

// Raw CSV data for schools with 1º Ciclo - parsed from RedeEscolas.csv
const schoolsData: SchoolData[] = [
  // Will be populated from CSV
];

export default function ImportSchoolsPage() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const parseCSV = (text: string): SchoolData[] => {
    const lines = text.split('\n');
    const schools: SchoolData[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Parse CSV line (handling quoted fields)
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());
      
      // CSV columns: CODIGO,NOME,CODUOME,NOMEUO,SEDE,MORADA,LOCALIDADE,CONCELHO,DISTRITO,CP,...,CICLO,...
      // Indexes:      0      1    2       3      4    5      6          7        8       9      13
      const ciclo = fields[13] || '';
      
      if (ciclo.includes('1º Ciclo')) {
        const name = fields[1]?.replace(/^"|"$/g, '').trim();
        const locality = fields[6]?.replace(/^"|"$/g, '').trim();
        const municipality = fields[7]?.replace(/^"|"$/g, '').trim();
        const district = fields[8]?.replace(/^"|"$/g, '').trim();
        
        if (name && district) {
          schools.push({
            name,
            district,
            municipality: municipality || '',
            locality: locality || '',
          });
        }
      }
    }
    
    return schools;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Por favor selecione o ficheiro CSV");
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const text = await file.text();
      const schools = parseCSV(text);
      
      console.log(`Parsed ${schools.length} schools with 1º Ciclo`);
      toast.info(`Encontradas ${schools.length} escolas com 1º Ciclo`);

      // Clear existing schools
      const { error: deleteError } = await supabase
        .from('schools')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      // Insert in batches of 100
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < schools.length; i += batchSize) {
        const batch = schools.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('schools')
          .insert(batch);

        if (error) {
          console.error(`Batch error:`, error);
          toast.error(`Erro no lote ${Math.floor(i/batchSize) + 1}: ${error.message}`);
        } else {
          inserted += batch.length;
          setProgress(Math.round((inserted / schools.length) * 100));
        }
      }

      toast.success(`Importadas ${inserted} escolas com sucesso!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Erro na importação");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Importar Escolas</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Ficheiro CSV (RedeEscolas.csv)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm border rounded p-2"
            />
          </div>

          {file && (
            <p className="text-sm text-muted-foreground">
              Ficheiro selecionado: {file.name}
            </p>
          )}

          <Button 
            onClick={handleImport} 
            disabled={importing || !file}
            className="w-full"
          >
            {importing ? `A importar... ${progress}%` : 'Importar Escolas do 1º Ciclo'}
          </Button>

          {importing && (
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
