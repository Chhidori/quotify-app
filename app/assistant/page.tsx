"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
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

  const recognitionRef = useRef<any>(null);
  const [listeningForEnd, setListeningForEnd] = useState(false);
  const recognitionRetryRef = useRef(0);
  const MAX_RETRIES = 3;

  const stopVoiceEndListener = () => {
    const rec = recognitionRef.current;
    try {
      if (rec && typeof rec.stop === "function") rec.stop();
    } catch (e) {
      console.warn("Error stopping recognition:", e);
    }
    recognitionRef.current = null;
    setListeningForEnd(false);
    try {
      // stop any speaking in progress
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn("Error cancelling TTS:", e);
    }
    recognitionRetryRef.current = 0;
  };

  const startVoiceEndListener = (opts?: { onEnd?: () => void }) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not available in this browser.");
      return;
    }

    // Ensure mic permission prompt (quick check) so recognition doesn't fail immediately
    const ensureMic = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        // stop tracks immediately - we only wanted the permission prompt
        s.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn("Microphone permission denied or unavailable:", e);
        // don't return — still try to start recognition, it will surface proper error
      }
    };

    ensureMic().finally(() => {
      try {
        const rec = new SpeechRecognition();
        rec.lang = "en-US";
        rec.continuous = true;
        rec.interimResults = false;

        rec.onresult = (e: any) => {
          const transcript = Array.from(e.results)
            .map((r: any) => r[0].transcript)
            .join(" ")
            .toLowerCase();
          const endTerms = [
            "end call",
            "hang up",
            "disconnect",
            "stop",
            "goodbye",
            "bye",
            "terminate call",
            "end the call",
          ];
          if (endTerms.some((t) => transcript.includes(t))) {
            console.log("End-term detected via voice:", transcript);
            // stop recognition so it doesn't capture the confirmation TTS
            try {
              if (rec && typeof rec.stop === "function") rec.stop();
            } catch (err) {
              console.warn("Error stopping recognition before TTS:", err);
            }

            // short TTS confirmation, then disconnect after TTS ends
            try {
              const text = "Got it. Ending the call.";
              const utter = new SpeechSynthesisUtterance(text);
              utter.lang = "en-US";
              utter.onend = () => {
                try {
                  (room as any)?.disconnect?.();
                } catch (err) {
                  console.error("Error disconnecting room:", err);
                }
                setListeningForEnd(false);
                recognitionRef.current = null;
                recognitionRetryRef.current = 0;
                // ensure user returns to dashboard after call ends
                try {
                  router.push("/dashboard");
                } catch (e) {
                  console.warn("Failed to navigate to dashboard:", e);
                }
                if (opts?.onEnd) opts.onEnd();
              };
              window.speechSynthesis.cancel(); // ensure no queued speech
              window.speechSynthesis.speak(utter);
            } catch (err) {
              console.error("TTS error; disconnecting immediately:", err);
              try {
                (room as any)?.disconnect?.();
              } catch (e) {
                console.error(e);
              }
              setListeningForEnd(false);
              recognitionRef.current = null;
              recognitionRetryRef.current = 0;
              try {
                router.push("/dashboard");
              } catch (e) {
                console.warn("Failed to navigate to dashboard:", e);
              }
              if (opts?.onEnd) opts.onEnd();
            }
          }
        };

        rec.onerror = (err: any) => {
          // log useful properties — SpeechRecognitionErrorEvent may be non-enumerable
          console.error("SpeechRecognition error:", {
            event: err,
            code: err?.error || err?.type,
            message: err?.message,
          });
           const code = err?.error || err?.type || "";
           // common recoverable error: no-speech -> retry a few times
           if (code === "no-speech" || code === "no-speecherror") {
             if (recognitionRetryRef.current < MAX_RETRIES) {
               recognitionRetryRef.current += 1;
               const backoff = 500 + recognitionRetryRef.current * 300;
               console.warn(`no-speech detected, retrying (${recognitionRetryRef.current}/${MAX_RETRIES}) after ${backoff}ms`);
               setTimeout(() => {
                 try {
                   if (rec && typeof rec.start === "function") rec.start();
                 } catch (e) {
                   console.warn("Restart recognition failed:", e);
                 }
               }, backoff);
               return;
             } else {
               console.warn("Max no-speech retries reached. Stopping listener.");
               stopVoiceEndListener();
               return;
             }
           }

           // permission / blocked errors: inform and stop
           if (code === "not-allowed" || code === "permission-denied" || code === "service-not-allowed") {
             console.warn("Microphone access blocked. Please enable microphone permissions for this site.");
             stopVoiceEndListener();
           }
         };

        rec.onend = () => {
          setListeningForEnd(false);
        };

        rec.start();
        recognitionRef.current = rec;
        setListeningForEnd(true);
        recognitionRetryRef.current = 0;
        console.log("Voice end-listener started");
      } catch (err) {
        console.error("Failed to start SpeechRecognition:", err);
      }
    }); // ensureMic finally
  };
  
  useEffect(() => {
    return () => {
      stopVoiceEndListener();
    };
  }, [room]);

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
    ) as (() => void) | undefined;
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
          
          console.log(" Sending to server API...");
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
            console.error("Server returned error:", result.message);
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
        console.error("Error handling saveQuotation RPC:", err);
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
    ) as (() => void) | undefined;
    console.log("saveQuotation RPC method registered");

    // RPC Handler for conversation logging
    const handleConversationLogRPC = async (data: any) => {
      try {
        console.log("📝 logConversation RPC received");
        
        const request = JSON.parse(data.payload);
        
        if (request.type === "conversation_log") {
          const logData = request.data;
          
          // Call API to store conversation log
          const response = await fetch("/api/conversation-logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(logData),
          });
          
          const result = await response.json();
          
          if (result.status === "success") {
            console.log(`✅ Conversation log stored: [${logData.speaker}] ${logData.text.substring(0, 50)}...`);
            return JSON.stringify({
              status: "success",
              log_id: result.log_id,
            });
          } else {
            console.error("Failed to store conversation log:", result.message);
            return JSON.stringify({
              status: "error",
              message: result.message,
            });
          }
        }
        
        return JSON.stringify({ 
          status: "error", 
          message: "Invalid request type" 
        });
        
      } catch (err) {
        console.error("Error handling logConversation RPC:", err);
        return JSON.stringify({
          status: "error",
          message: `Failed to log conversation: ${err}`,
        });
      }
    };

    // Register logConversation RPC method
    console.log("Registering RPC method: logConversation");
    const unregisterLog = room.localParticipant.registerRpcMethod(
      "logConversation",
      handleConversationLogRPC
    ) as (() => void) | undefined;
    console.log("logConversation RPC method registered");

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
      if (typeof unregisterLog === 'function') {
        unregisterLog();
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
      // open preview in new tab so this page (and the listener) keeps running
      window.open(`/quotations/${savedQuotationId}/preview`, "_blank");
      startVoiceEndListener();
    }
  };

  if (!quotation) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-4 sm:mb-6">
      {/* Success Message Banner */}
      {showSuccessMessage && savedQuotationId && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-900 text-sm sm:text-base">Quotation Saved Successfully!</p>
              </div>
            </div>
            <button
              onClick={handleViewPreview}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Preview
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Quotation</h2>
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
              className="text-xs sm:text-sm font-medium text-gray-800 border-b-2 border-blue-500 focus:outline-none px-2 py-1 w-32 sm:w-auto"
              placeholder="Enter customer name"
            />
          ) : (
            <button
              onClick={() => setIsEditingCustomer(true)}
              className="text-xs sm:text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
            >
              {customerName || "Voice Customer"}
              <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotation.items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                  {item.qty}
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-600 text-right">
                  ₹{item.rate.toFixed(2)}
                </td>
                <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-900 text-right font-medium">
                  ₹{item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <td
                colSpan={3}
                className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-gray-900"
              >
                Total Amount:
              </td>
              <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                <span className="text-base sm:text-lg font-bold text-blue-600">
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
  isMuted,
  setIsMuted,
  isPaused,
  setIsPaused,
  onStateChange,
  onEndCall,
  agentState,
}: {
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  onStateChange: (state: AgentState) => void;
  onEndCall: () => void;
  agentState: AgentState;
}) {
  const assistant = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();

  // Mute mic only (track.enabled)
  const handleMute = async () => {
    setIsMuted((prev) => {
      const next = !prev;
      // Find the local audio track and set enabled
      if (localParticipant) {
        localParticipant.getTrackPublications()
          .filter((pub) => pub.kind === 'audio' && pub.track)
          .forEach((pub) => {
            if (pub.track && 'enabled' in pub.track) {
              (pub.track as any).enabled = !next;
            }
          });
      }
      return next;
    });
  };

  // Pause/Resume: disables mic and agent listening
  const handlePauseResume = () => {
    setIsPaused((prev) => {
      const next = !prev;
      // On pause: always disable mic
      // On resume: enable mic only if not muted
      if (localParticipant) {
        localParticipant.getTrackPublications()
          .filter((pub) => pub.kind === 'audio' && pub.track)
          .forEach((pub) => {
            if (pub.track && 'enabled' in pub.track) {
              if (next) {
                // Paused: always disable
                (pub.track as any).enabled = false;
              } else {
                // Resume: enable only if not muted
                (pub.track as any).enabled = !isMuted;
              }
            }
          });
      }
      // Stop agent listening (UI only, or call API if available)
      if (assistant && 'stopListening' in assistant && typeof (assistant as any).stopListening === 'function' && next) {
        (assistant as any).stopListening();
      }
      if (assistant && 'resumeListening' in assistant && typeof (assistant as any).resumeListening === 'function' && !next) {
        (assistant as any).resumeListening();
      }
      return next;
    });
  };

  useEffect(() => {
    onStateChange(assistant.state as AgentState);
  }, [assistant.state, onStateChange]);

  // Button handlers
  const handleEndCall = () => {
    if (onEndCall) onEndCall();
  };
  const handlePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Main UI with white background and centered controls
  return (
    <div className="relative flex flex-col justify-center items-center w-full">
      {/* Control bar centered */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <div className="flex gap-4 sm:gap-8 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl bg-white shadow-xl border border-gray-200">
          {/* Mute button */}
          <button
            onClick={handleMute}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-colors duration-150 ${isMuted ? 'bg-red-500' : 'bg-blue-500'} shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/30 hover:opacity-90`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <MicOff className="w-8 h-8 sm:w-11 sm:h-11 text-white" />
            ) : (
              <Mic className="w-8 h-8 sm:w-11 sm:h-11 text-white" />
            )}
          </button>
          {/* Pause/Resume button (replaces video) */}
          <button
            onClick={handlePauseResume}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-colors duration-150 bg-gray-700 shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-500/30 hover:opacity-90"
            aria-label={isPaused ? 'Resume audio' : 'Pause audio'}
          >
            {isPaused ? (
              // Play icon (bold, white)
              <svg className="w-8 h-8 sm:w-11 sm:h-11 text-white" fill="white" viewBox="0 0 24 24">
                <polygon points="8,5 20,12 8,19" />
              </svg>
            ) : (
              // Pause icon (bold, white)
              <svg className="w-8 h-8 sm:w-11 sm:h-11 text-white" fill="white" viewBox="0 0 24 24">
                <rect x="7" y="5" width="3.5" height="14" rx="1.5" />
                <rect x="13.5" y="5" width="3.5" height="14" rx="1.5" />
              </svg>
            )}
          </button>
          {/* End call button */}
          <button onClick={handleEndCall} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-colors duration-150 bg-red-500 shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-500/30 hover:opacity-90" aria-label="End call">
            <PhoneOff className="w-8 h-8 sm:w-11 sm:h-11 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main page logic for connection and rendering
function AssistantPageContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  interface ConnectionDetails {
    serverUrl: string;
    roomName: string;
    participantToken: string;
  }
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [agentState, setAgentState] = useState<AgentState>(
    AgentState.DISCONNECTED
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

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
      // Attempt recovery: check sessionStorage/localStorage for saved connection details
      let recovered = null;
      try {
        if (typeof window !== "undefined") {
          const fromSession = sessionStorage.getItem("connectionDetails");
          const fromLocal = localStorage.getItem("connectionDetails");
          const raw = fromSession || fromLocal;
          if (raw) recovered = JSON.parse(raw);
        }
      } catch (e) {
        console.warn("Failed to read saved connection details:", e);
      }

      if (recovered && recovered.serverUrl && recovered.roomName && recovered.participantToken) {
        console.log("Recovered connection details from storage");
        setConnectionDetails(recovered as ConnectionDetails);
      } else {
        console.warn("Missing required parameters; redirecting to dashboard");
        setConnectionError("Missing connection parameters");
        // Redirect user to dashboard after a short delay to allow the error UI to render briefly
        setTimeout(() => {
          try {
            router.push("/dashboard");
          } catch (e) {
            // fallback to hard navigation
            if (typeof window !== "undefined") window.location.href = "/dashboard";
          }
        }, 1200);
      }
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
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
      />
    </LiveKitRoom>
  );
}

// RoomContent component definition
function RoomContent({
  isMuted,
  setIsMuted,
  isPaused,
  setIsPaused,
  onStateChange,
  onDisconnect,
}: {
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  onStateChange?: (state: AgentState) => void;
  onDisconnect?: () => void;
}) {
  const [agentState, setAgentState] = useState<AgentState>(AgentState.CONNECTED);

  const handleStateChange = (state: AgentState) => {
    setAgentState(state);
    if (onStateChange) onStateChange(state);
  };

  // Determine indicator appearance based on state
  const getIndicatorConfig = () => {
    if (isPaused) {
      return {
        bgColor: 'bg-yellow-500',
        text: 'Paused',
        pulseColor: 'bg-yellow-300',
        animate: false
      };
    }
    if (isMuted) {
      return {
        bgColor: 'bg-red-500',
        text: 'Muted',
        pulseColor: 'bg-red-300',
        animate: false
      };
    }
    switch (agentState) {
      case AgentState.LISTENING:
        return {
          bgColor: 'bg-green-500',
          text: 'Listening',
          pulseColor: 'bg-green-300',
          animate: true
        };
      case AgentState.THINKING:
        return {
          bgColor: 'bg-purple-500',
          text: 'Processing',
          pulseColor: 'bg-purple-300',
          animate: true
        };
      case AgentState.SPEAKING:
        return {
          bgColor: 'bg-blue-500',
          text: 'Speaking',
          pulseColor: 'bg-blue-300',
          animate: true
        };
      case AgentState.CONNECTING:
        return {
          bgColor: 'bg-gray-500',
          text: 'Connecting',
          pulseColor: 'bg-gray-300',
          animate: true
        };
      case AgentState.DISCONNECTED:
        return {
          bgColor: 'bg-gray-500',
          text: 'Disconnected',
          pulseColor: 'bg-gray-300',
          animate: false
        };
      default:
        return {
          bgColor: 'bg-blue-500',
          text: 'Connected',
          pulseColor: 'bg-blue-300',
          animate: false
        };
    }
  };

  const indicator = getIndicatorConfig();

  // Centered layout with white background
  return (
    <div
      className="w-screen h-screen min-h-0 min-w-0 flex flex-col items-center justify-between bg-white overflow-auto"
      style={{ width: '100vw', height: '100vh' }}
    >
      <div className="flex flex-col w-full items-center gap-4 sm:gap-8 py-4 sm:py-8 px-3 sm:px-4">
        {/* Live indicator at top with dynamic state */}
        <div className="flex items-center justify-center pt-2">
          <div className={`flex items-center gap-2 ${indicator.bgColor} px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-md transition-all duration-300`}>
            <div className="relative w-4 h-4 sm:w-5 sm:h-5">
              {indicator.animate && (
                <span className={`absolute inline-flex h-full w-full rounded-full ${indicator.pulseColor} opacity-75 animate-ping`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-white`}></span>
            </div>
            <span className="text-white font-semibold text-sm sm:text-lg tracking-wide">{indicator.text}</span>
          </div>
        </div>
        
        {/* Quotation centered in middle */}
        <div className="w-full max-w-4xl flex items-center justify-center">
          <QuotationDisplay />
        </div>
      </div>
      
      {/* Assistant controls at bottom - fixed */}
      <div className="w-full flex flex-col items-center pb-4 sm:pb-8">
        <VoiceAssistantComponent
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          onStateChange={handleStateChange}
          onEndCall={onDisconnect || (() => {})}
          agentState={agentState}
        />
        <RoomAudioRenderer />
      </div>
    </div>
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
      <AssistantPageContainer />
    </Suspense>
  );
}
