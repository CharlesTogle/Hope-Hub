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
    const { userData } = await req.json();
    const { email, password, name, userType, lectureProgress } = userData;
    try {
      const rateLimit = await enforceRateLimit(req, "registration", email);
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
          ...corsHeadersFor(req),
          "Content-Type": "application/json"
        }
      });
    }
    if (trimmedPassword.length < 8) {
      return new Response(JSON.stringify({
        message: "Password must be at least 8 characters"
      }), {
        status: 400,
        headers: {
          ...corsHeadersFor(req),
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
        ...corsHeadersFor(req),
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("registration error:", err);
    return new Response(JSON.stringify({
      message: "Registration failed. Please try again."
    }), {
      headers: {
        ...corsHeadersFor(req),
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
