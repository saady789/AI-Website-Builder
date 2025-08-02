import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

export function Security() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Performing the required security checks
        </h1>
      </div>
    </div>
  );
}
