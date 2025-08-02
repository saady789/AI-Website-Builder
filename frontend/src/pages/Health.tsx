import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export function Health() {
  const [status, setStatus] = useState<"loading" | "healthy" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/health`);
        if (res.status === 200) {
          setStatus("healthy");
          setMessage(res.data?.message || "Backend is healthy");
        } else {
          throw new Error("Unexpected status");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Backend is unreachable or returned an error.");
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Backend Health Check
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Verifying if the backend is responsive and CORS is configured
          correctly.
        </p>

        {status === "loading" && (
          <div className="text-blue-400 animate-pulse text-xl font-semibold">
            Checking status...
          </div>
        )}

        {status === "healthy" && (
          <div className="flex flex-col items-center text-green-400">
            <CheckCircle className="w-10 h-10 mb-2" />
            <p className="text-lg font-medium">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center text-red-400">
            <AlertTriangle className="w-10 h-10 mb-2" />
            <p className="text-lg font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
