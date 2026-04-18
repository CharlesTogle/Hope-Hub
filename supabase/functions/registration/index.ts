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
    const { userData } = await req.json();
    const { email, password, name, userType, lectureProgress } = userData;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    const fields = [
      trimmedEmail,
      trimmedPassword,
      trimmedName
    ];
    const areAllFieldsFilled = fields.every((field)=>field !== "");
    if (!areAllFieldsFilled) {
      return new Response(JSON.stringify({
        message: "Please fill in all required fields"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: trimmedPassword,
      options: {
        emailRedirectTo: "https://hope-hub-fitness.vercel.app/auth/account-verification",
        data: {
          fullName: trimmedName,
          userType: userType,
          classCode: null,
          lectureProgress: lectureProgress,
          password: trimmedPassword
        }
      }
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
    const errorMessage = err && typeof err === "object" && "message" in err ? err.message : String(err);
    return new Response(JSON.stringify({
      message: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
}); //curl --request POST "http://127.0.0.1:54321/functions/v1/registration" --header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" --header "Content-Type: application/json" --data "{\"userData\": { \"email\": \"test@example.com\", \"password\": \"yourpassword\", \"name\": \"John\", \"userType\": \"student\", \"classCode\": null, \"lectureProgress\": [] }}"
