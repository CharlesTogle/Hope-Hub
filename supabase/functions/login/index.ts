// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2.43.4";
import { Redis } from "https://deno.land/x/upstash_redis@v1.19.3/mod.ts";
import { Ratelimit } from "https://cdn.skypack.dev/@upstash/ratelimit@latest";
Deno.serve(async (req)=>{
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")
        }
      }
    });
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        message: "Method not allowed"
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL"),
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")
    });
    const ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "10 s")
    });
    const identifier = "api";
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
      return new Response(JSON.stringify({
        message: "rate limit Exceeded"
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { email, password } = await req.json();
    if (email === "" || password === "") {
      return new Response(JSON.stringify({
        message: "Please fill up all fields"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw error;
    }
    return new Response(JSON.stringify({
      data
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      message: String(err)
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
}); /* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/login' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/  //curl http://127.0.0.1:54321/functions/v1/login
 //curl --request POST "https://pcgsdfbkpnfgcvdopgzz.supabase.co/functions/v1/login" --header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZ3NkZmJrcG5mZ2N2ZG9wZ3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMjUwMTQsImV4cCI6MjA2MTkwMTAxNH0.SGi2LdPmTbrFnG8M8NexCzPlcL30vPTySQe8JmtfWgU" --header "Content-Type: application/json" --data "{\"email\": \"test@example.com\", \"password\": \"yourpassword\"}"
