// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeadersFor } from "../_shared/cors.ts";
import {
  enforceRateLimit,
  rateLimitResponse,
  RateLimitUnavailableError,
} from "../_shared/rate-limit.ts";
import { createClient } from "npm:@supabase/supabase-js@2.43.4";
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
          ...corsHeadersFor(req),
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
          ...corsHeadersFor(req),
          "Content-Type": "application/json"
        }
      });
    }
    const { email, password } = await req.json();
    try {
      const rateLimit = await enforceRateLimit(req, "login", email);
      if (!rateLimit.allowed) return rateLimitResponse(req, rateLimit.retryAfterSeconds);
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return new Response(JSON.stringify({ message: "Authentication is temporarily unavailable." }), {
          status: 503,
          headers: { ...corsHeadersFor(req), "Content-Type": "application/json", "Retry-After": "60" },
        });
      }
      throw error;
    }
    if (email === "" || password === "") {
      return new Response(JSON.stringify({
        message: "Please fill up all fields"
      }), {
        headers: {
          ...corsHeadersFor(req),
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
        ...corsHeadersFor(req),
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("login error:", err);
    const errorCode = err && typeof err === "object" && "code" in err ? err.code : undefined;
    if (errorCode === "invalid_credentials") {
      return new Response(JSON.stringify({ message: "Invalid login credentials" }), {
        headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
        status: 400,
      });
    }
    if (errorCode === "email_not_confirmed") {
      return new Response(JSON.stringify({ message: "email not confirmed" }), {
        headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
        status: 400,
      });
    }
    return new Response(JSON.stringify({
      message: "Login failed. Please try again."
    }), {
      headers: {
        ...corsHeadersFor(req),
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
