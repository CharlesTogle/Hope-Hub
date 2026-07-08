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
    const { email, password } = await req.json();
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const identifier = `login:${ip}:${(email ?? "").toLowerCase()}`;
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL"),
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")
    });
    const ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "10 s")
    });
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
    console.error("login error:", err);
    return new Response(JSON.stringify({
      message: "Login failed. Please try again."
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
