"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";

// Agent states
enum AgentState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  LISTENING = "listening",
  THINKING = "thinking",
  SPEAKING = "speaking",
}

interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantToken: string;
}

interface QuotationItem {
  name: string;
  qty: number;
  rate: number;
  subtotal: number;
}

interface Quotation {
  customer: string;
  items: QuotationItem[];
  total: number;
  timestamp: string;
}

// Quotation Display Component
function QuotationDisplay() {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const room = useRoomContext();
  const router = useRouter();

  useEffect(() => {
    if (!room) {
      console.log("Waiting for room to be ready...");
      return;
    }

    if (!room.localParticipant) {
      console.log("Waiting for localParticipant...");
      return;
    }

    console.log("Setting up RPC and data channel listeners");
    console.log("Room name:", room.name);
    console.log("Local participant:", room.localParticipant.identity);

    // RPC Handler for quotation updates (primary method)
    const handleQuotationRPC = async (data: any) => {
      try {
        console.log("RPC received: updateQuotation");
        console.log("Payload:", data.payload);
        
        const response = JSON.parse(data.payload);
        console.log("Parsed response:", response);
        
        if (response.type === "quotation_update") {
          console.log("Processing quotation update via RPC");
          
          if (response.data) {
            const newQuotation = response.data;
            console.log("New quotation:", newQuotation);
            
            // Update state
            if (newQuotation.items?.length > 0 || newQuotation.customer) {
              setQuotation(newQuotation);
              setCustomerName(newQuotation.customer || "Voice Customer");
              console.log("Quotation updated successfully via RPC");
            } else {
              setQuotation(null);
              setCustomerName("");
              console.log("Quotation cleared via RPC");
            }
          }
        }
        
        // Return acknowledgment
        return JSON.stringify({ status: "success", message: "Quotation received" });
      } catch (err) {
        console.error("Error handling RPC:", err);
        throw new Error(`Failed to process quotation: ${err}`);
      }
    };

    // Register RPC method using the new API
    console.log("Registering RPC method: updateQuotation");
    const unregister = room.localParticipant.registerRpcMethod(
      "updateQuotation", 
      handleQuotationRPC
    );
    console.log("RPC method registered");

    // RPC Handler for saving quotation to database
    const handleSaveQuotationRPC = async (data: any) => {
      try {
        console.log("=".repeat(80));
        console.log("🔵 saveQuotation RPC received");
        console.log("Payload:", data.payload);
        
        const request = JSON.parse(data.payload);
        console.log("Parsed request:", request);
        
        if (request.type === "save_quotation") {
          console.log("Processing save quotation request");
          
          // Extract the entire data object
          const quotationData = request.data;
          
          console.log("📤 Sending to server API...");
          console.log("  - Customer:", quotationData.customer);
          console.log("  - Items:", quotationData.quotation_data?.length);
          console.log("  - Total:", quotationData.total_amount);
          
          // Call server API to save to database - send the entire data object
          const response = await fetch("/api/quotations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(quotationData),
          });
          
          const result = await response.json();
          console.log("📥 Server response:", result);
          
          if (result.status === "success") {
            console.log("✅ QUOTATION SAVED TO DATABASE");
            console.log("  - Quotation ID:", result.quotation_id);
            console.log("=".repeat(80));
            
            // Store the quotation ID and show success message
            setSavedQuotationId(result.quotation_id);
            setShowSuccessMessage(true);
            
            // Return success response to agent
            return JSON.stringify({
              status: "success",
              message: "Quotation saved successfully",
              quotation_id: result.quotation_id,
              total_amount: result.total_amount,
            });
          } else {
            console.error("❌ Server returned error:", result.message);
            return JSON.stringify({
              status: "error",
              message: result.message || "Failed to save quotation",
            });
          }
        }
        
        return JSON.stringify({ 
          status: "error", 
          message: "Invalid request type" 
        });
        
      } catch (err) {
        console.error("❌ Error handling saveQuotation RPC:", err);
        console.error("=".repeat(80));
        return JSON.stringify({
          status: "error",
          message: `Failed to save quotation: ${err}`,
        });
      }
    };

    // Register saveQuotation RPC method
    console.log("Registering RPC method: saveQuotation");
    const unregisterSave = room.localParticipant.registerRpcMethod(
      "saveQuotation",
      handleSaveQuotationRPC
    );
    console.log("saveQuotation RPC method registered");

    // Data Channel Handler (fallback)
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      try {
        console.log("Data channel message received from:", participant?.identity);
        console.log("Payload size:", payload.byteLength, "bytes");
        
        const decoder = new TextDecoder();
        const dataStr = decoder.decode(payload);
        console.log("Decoded data:", dataStr);
        
        const response = JSON.parse(dataStr);
        console.log("Parsed response:", response);
        
        if (response.type === "quotation_update") {
          console.log("Processing quotation update via data channel");
          
          if (response.data) {
            const newQuotation = response.data;
            console.log("New quotation:", newQuotation);
            
            if (newQuotation.items?.length > 0 || newQuotation.customer) {
              setQuotation(newQuotation);
              setCustomerName(newQuotation.customer || "Voice Customer");
              console.log("Quotation updated successfully via data channel");
            } else {
              setQuotation(null);
              setCustomerName("");
              console.log("Quotation cleared via data channel");
            }
          }
        }
      } catch (err) {
        console.error("Error parsing data:", err);
      }
    };

    // Register data channel listener (fallback)
    console.log("Registering data channel listener");
    room.localParticipant.on("dataReceived", handleDataReceived);
    console.log("Listener registered");

    // Audio context handling
    const resumeAudioContext = async () => {
      try {
        const audioContext = (room as any).audioContext;
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log("Audio context resumed");
        }
      } catch (err) {
        console.error("Failed to resume audio context:", err);
      }
    };

    resumeAudioContext();

    const handleUserInteraction = () => {
      resumeAudioContext();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keypress', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keypress', handleUserInteraction);

    // Cleanup
    return () => {
      console.log("Cleaning up RPC and data channel listeners");
      if (typeof unregister === 'function') {
        unregister();
      }
      if (typeof unregisterSave === 'function') {
        unregisterSave();
      }
      room.localParticipant?.off("dataReceived", handleDataReceived);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keypress', handleUserInteraction);
    };
  }, [room]);

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerName(e.target.value);
  };

  const handleCustomerNameBlur = () => {
    setIsEditingCustomer(false);
    // Update the quotation with new customer name
    if (quotation) {
      setQuotation({
        ...quotation,
        customer: customerName || "Voice Customer"
      });
    }
  };

  const handleViewPreview = () => {
    if (savedQuotationId) {
      router.push(`/quotations/${savedQuotationId}/preview`);
    }
  };

  if (!quotation) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quotation</h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No quotation yet</p>
          <p className="text-sm text-gray-400 mt-1">Start speaking to add items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
      {/* Success Message Banner */}
      {showSuccessMessage && savedQuotationId && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-900">Quotation Saved Successfully!</p>
                <p className="text-sm text-green-700">Your quotation has been saved to the database.</p>
              </div>
            </div>
            <button
              onClick={handleViewPreview}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Preview
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Quotation</h2>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Customer Name</p>
          {isEditingCustomer ? (
            <input
              type="text"
              value={customerName}
              onChange={handleCustomerNameChange}
              onBlur={handleCustomerNameBlur}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCustomerNameBlur();
                }
              }}
              autoFocus
              className="text-sm font-medium text-gray-800 border-b-2 border-blue-500 focus:outline-none px-2 py-1"
              placeholder="Enter customer name"
            />
          ) : (
            <button
              onClick={() => setIsEditingCustomer(true)}
              className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
            >
              {customerName || "Voice Customer"}
              <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotation.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                  {item.qty}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                  ₹{item.rate.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                  ₹{item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <td
                colSpan={3}
                className="px-6 py-4 text-right text-sm font-semibold text-gray-900"
              >
                Total Amount:
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className="text-lg font-bold text-blue-600">
                  ₹{quotation.total.toFixed(2)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {quotation.timestamp && (
        <div className="mt-4 text-xs text-gray-400 text-right">
          Last updated: {new Date(quotation.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Voice Assistant Component - Gemini Inspired
function VoiceAssistantComponent({
  onStateChange,
  onEndCall,
}: {
  onStateChange: (state: AgentState) => void;
  onEndCall: () => void;
}) {
  const assistant = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    onStateChange(assistant.state as AgentState);
  }, [assistant.state, onStateChange]);

  const toggleMute = async () => {
    if (localParticipant) {
      const newMutedState = !isMuted;
      await localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const getStatusColor = () => {
    switch (assistant.state) {
      case "speaking":
        return "bg-green-500";
      case "listening":
        return "bg-blue-500";
      case "thinking":
        return "bg-yellow-500";
      case "connected":
        return "bg-green-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (assistant.state) {
      case "speaking":
        return "Speaking";
      case "listening":
        return "Listening";
      case "thinking":
        return "Thinking";
      case "connected":
        return "Connected";
      default:
        return "Idle";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* Status Bar */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${
            assistant.state === "speaking" || assistant.state === "listening" 
              ? "animate-pulse" 
              : ""
          }`} />
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Visualizer */}
      <div className="mb-8 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
        {assistant.audioTrack ? (
          <div className="w-full h-full flex items-center justify-center">
            <BarVisualizer
              state={assistant.state}
              barCount={5}
              trackRef={assistant.audioTrack}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Waiting for audio...</p>
          </div>
        )}
      </div>

      {/* Control Buttons - Gemini Style */}
      <div className="flex items-center justify-center gap-4">
        {/* Microphone Button - Center */}
        <button
          onClick={toggleMute}
          className={`relative group transition-all duration-300 ${
            isMuted 
              ? "w-16 h-16 bg-red-500 hover:bg-red-600" 
              : "w-20 h-20 bg-blue-500 hover:bg-blue-600"
          } rounded-full shadow-lg hover:shadow-xl flex items-center justify-center`}
        >
          {isMuted ? (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
          
          {/* Pulse Animation when active */}
          {!isMuted && (assistant.state === "listening" || assistant.state === "speaking") && (
            <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30" />
          )}
        </button>

        {/* End Call Button - Right */}
        <button
          onClick={onEndCall}
          className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          <svg className="w-6 h-6 text-white transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>

      {/* Status Text */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          {isMuted ? "Microphone is muted" : "Speak naturally to create quotations"}
        </p>
      </div>
    </div>
  );
}

// Room Content Wrapper
function RoomContent({
  onStateChange,
  onDisconnect,
}: {
  onStateChange: (state: AgentState) => void;
  onDisconnect: () => void;
}) {
  const room = useRoomContext();
  
  useEffect(() => {
    console.log("Room mounted:", room.name);
    console.log("Participants:", room.remoteParticipants.size);
  }, [room]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quotation Assistant
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Powered by AI Voice Technology
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quotation Panel */}
          <div className="lg:col-span-2">
            <QuotationDisplay />
          </div>

          {/* Voice Assistant Panel */}
          <div className="lg:col-span-2">
            <VoiceAssistantComponent 
              onStateChange={onStateChange}
              onEndCall={onDisconnect}
            />
          </div>
        </div>
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

// Main Assistant Page Content
function AssistantPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [agentState, setAgentState] = useState<AgentState>(
    AgentState.DISCONNECTED
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Checking URL parameters");
    const token = searchParams.get("token");
    const url = searchParams.get("url");

    console.log("Token:", token ? "Present" : "Missing");
    console.log("URL:", url || "Missing");

    if (token && url) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roomName = payload.video?.room;
        
        if (!roomName) {
          throw new Error("Room name not found in token");
        }
        
        console.log("Connection details ready");
        console.log("Room name:", roomName);
        
        setConnectionDetails({
          serverUrl: url,
          roomName: roomName,
          participantToken: token,
        });
      } catch (e) {
        console.error("Failed to parse token:", e);
        setConnectionError("Invalid token format");
      }
    } else {
      console.error("Missing required parameters");
      setConnectionError("Missing connection parameters");
    }
  }, [searchParams]);

  const handleDisconnect = () => {
    router.push("/dashboard");
  };

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6">{connectionError}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!connectionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Initializing connection...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={connectionDetails.serverUrl}
      token={connectionDetails.participantToken}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={handleDisconnect}
    >
      <RoomContent 
        onStateChange={setAgentState}
        onDisconnect={handleDisconnect}
      />
    </LiveKitRoom>
  );
}

// Main page with Suspense boundary
export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
}
