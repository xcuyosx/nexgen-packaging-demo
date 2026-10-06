import {createEmailPreviewHandler} from './handler.ts'
Deno.serve(createEmailPreviewHandler({url:Deno.env.get('SUPABASE_URL')||'',key:Deno.env.get('SUPABASE_ANON_KEY')||''}))
