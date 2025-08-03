import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export function Home() {
  const [backendReady, setBackendReady] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get(`${BACKEND_URL}/health`);
        setBackendReady(true);
      } catch (err) {
        console.error("Backend not ready:", err);
      } finally {
        setCheckingBackend(false);
      }
    };

    checkBackend();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitMessage(null);

    const trimmed = prompt.trim();
    console.log("the prompt is " + prompt);
    if (!trimmed) return;

    try {
      setLoading(true);

      const res = await axios.post(`${BACKEND_URL}/chat`, {
        messages: [{ role: "user", content: trimmed }],
      });
      console.log("response is " + res);

      // If success, allow navigation
      navigate("/builder", { state: { prompt: trimmed } });
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAt = error.response.data?.retryAt;
        console.log("RetryAt is", retryAt);

        if (retryAt) {
          const retryDate = new Date(retryAt);
          const formatted = retryDate.toLocaleString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          setRateLimitMessage(`on ${formatted}`);
        } else {
          setRateLimitMessage("soon. Try again later.");
        }
      } else {
        console.error("Unexpected error:", error);
        setRateLimitMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  if (checkingBackend) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            🔄 Connecting to server... This may take a few seconds
          </h1>
          <p className="mt-2 text-gray-400">
            Please wait while we start the server.
          </p>
        </div>
      </div>
    );
  }

  if (!backendReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">
            ❌ Server Unavailable
          </h1>
          <p className="mt-2 text-gray-400">
            The backend server could not be reached. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Mobile block screen
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            This app is not compatible with mobile devices
          </h1>
          <p className="text-lg text-gray-300">
            Please use a desktop or laptop to access this website.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Wand2 className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Website Builder AI
          </h1>
          <p className="text-lg text-gray-300">
            Describe your dream frontend website, and we'll help you build it
            step by step. We currently only support react.
          </p>
        </div>

        {rateLimitMessage && (
          <div className="bg-gray-800 border border-red-500 text-red-400 p-4 rounded-lg mb-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-1">
              ⛔ Rate Limit Reached
            </h2>
            <p className="text-sm text-gray-300">
              You’ve already submitted once. You can try again after 7 days
              <span className="text-red-300 font-medium"></span>.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to build..."
              className="w-full h-32 p-4 bg-gray-900 text-gray-100 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-4 py-3 px-6 rounded-lg font-medium transition-colors ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 text-gray-100 hover:bg-blue-700"
              }`}
            >
              {loading ? "Checking..." : "Generate Website Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
