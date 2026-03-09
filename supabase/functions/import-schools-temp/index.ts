import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
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
  return fields;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, csvText, schools } = await req.json();

    // Legacy: batch insert
    if (action === 'insert' && schools) {
      const { error } = await supabase.from('schools').insert(schools);
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, inserted: schools.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // New: full CSV import in one call
    if (action === 'import_csv' && csvText) {
      // Step 1: Delete all existing schools
      console.log('Deleting existing schools...');
      const { error: deleteError } = await supabase
        .from('schools')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      // Step 2: Parse CSV
      const lines = csvText.split('\n');
      const schools: { name: string; district: string; municipality: string | null; locality: string | null }[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const fields = parseCSVLine(line);
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

      console.log(`Parsed ${schools.length} schools from CSV`);

      if (schools.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No 1º Ciclo schools found', parsed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 3: Insert in batches of 500
      let inserted = 0;
      let errors = 0;
      const batchSize = 500;

      for (let i = 0; i < schools.length; i += batchSize) {
        const batch = schools.slice(i, i + batchSize);
        const { error } = await supabase.from('schools').insert(batch);

        if (error) {
          console.error(`Batch error at ${i}:`, error);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted} total`);
      }

      return new Response(
        JSON.stringify({ success: true, parsed: schools.length, inserted, errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
