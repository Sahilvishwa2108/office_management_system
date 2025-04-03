// "use client";

// import { useEffect, useState } from "react";
// import { v4 as uuidv4 } from "uuid";
// import { useSession } from "next-auth/react"; // Import auth


// interface Message {
//   id: string;
//   name: string;
//   role: string;
//   message: string;
//   sentAt: string;
// }

// export default function ChatPage() {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [username, setUsername] = useState("Guest" + Math.floor(Math.random() * 1000));
//   const { data: session } = useSession(); 

//   // Fetch chat history on load
//   useEffect(() => {
//     const fetchMessages = async () => {
//       try {
//         const res = await fetch("/api/chat");
//         if (res.ok) {
//           const data: Message[] = await res.json();
//           setMessages(data.reverse());
//         }
//       } catch (error) {
//         console.error("Failed to fetch messages:", error);
//       }
//     };
//     fetchMessages();
//   }, []);

//   // Listen to server-sent events for real-time updates
//   useEffect(() => {
//     const eventSource = new EventSource("/api/chat/stream");
  
//     eventSource.onmessage = (event) => {
//       if (event.data !== "[DONE]") {
//         const newMessage: Message = JSON.parse(event.data);
  
//         // 🛠 Only add if it's truly new
//         // setMessages((prev) => {
//         //   return prev.find((msg) => msg.id === newMessage.id) ? prev : [...prev, newMessage];
//         // });
//       }
//     };
  
//     eventSource.onerror = (err) => {
//       console.error("❌ Stream error:", err);
//       eventSource.close();
//     };
  
//     return () => eventSource.close();
//   }, []);
  
  
  

//   // Send message
//   const sendMessage = async () => {
//     if (!input.trim()) return;
  
//     const newMessage: Message = {
//       id: uuidv4(), // Temporary ID
//       name: session?.user?.name || "Guest",
//       role: session?.user?.role || "",
//       message: input,
//       sentAt: new Date().toISOString(),
//     };
  
//     // 🔹 UI update immediately
//     setMessages((prev) => [...prev, newMessage]);
//     setInput(""); // Clear input field
  
//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newMessage),
//       });
  
//       const data = await res.json(); // Parse response
  
//       if (!res.ok) {
//         console.warn("⚠ Server error ignored");
//         return;
//       }  
  
//     } catch (error) {
//       console.error("❌ Network error:", error);
//     }
//   };
  
  
//   return (
//     <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
//       <div className="flex flex-col h-[90vh] w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
//         {/* Chat Header */}
//         <div className="bg-green-600 text-white p-4 font-bold text-lg">Chat</div>
  
//         {/* Messages Container (Auto-scroll to bottom) */}
//         <div
//           className="flex-1 overflow-y-auto flex flex-col p-4 space-y-2"
//           ref={(el) => el?.scrollTo(0, el.scrollHeight)} // Auto-scroll to latest message
//         >
//           {messages.map((msg) => (
//             <div
//               key={msg.id}
//               className={`p-2 max-w-[75%] rounded-lg ${
//                 msg.name === username
//                   ? "bg-green-500 text-white self-end"
//                   : "bg-gray-200 text-black self-start"
//               }`}
//             >
//               <p className="text-xs font-semibold">{msg.name}</p>
//               <p>{msg.message}</p>
//             </div>
//           ))}
//         </div>
  
//         {/* Input Field */}
//         <div className="flex items-center gap-2 p-3 border-t">
//           <input
//             type="text"
//             className="flex-1 p-2 border rounded-full focus:outline-none"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type a message..."
//           />
//           <button
//             className="bg-green-500 text-white px-4 py-2 rounded-full"
//             onClick={sendMessage}
//           >
//             Send
//           </button>
//         </div>
//       </div>
//     </div>
//   );
  
// }

/////////////////////////////////////////////////////////////






















"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react"; // Import auth



interface Message {
  id: string;
  name: string;
  role: string;
  message: string;
  sentAt: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("Guest" + Math.floor(Math.random() * 1000));
  const { data: session } = useSession(); 

  // Fetch chat history on load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(data.reverse());
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
    fetchMessages();
  }, []);

  // Listen to server-sent events for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/chat/stream");
  
    eventSource.onmessage = (event) => {
      if (event.data !== "[DONE]") {
        const newMessage: Message = JSON.parse(event.data);
  
        // 🛠 Only add if it's truly new
        setMessages((prev) => {
          return prev.find((msg) => msg.id === newMessage.id) ? prev : [...prev, newMessage];
        });
      }
    };
  
    eventSource.onerror = (err) => {
      console.error("❌ Stream error:", err);
      eventSource.close();
    };
  
    return () => eventSource.close();
  }, []);
  
  
  

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const newMessage: Message = {
      id: uuidv4(), // Temporary ID
      name: session?.user?.name || "Guest",
      role: session?.user?.role,
      message: input,
      sentAt: new Date().toISOString(),
    };
  
    // 🔹 UI update immediately
    // setMessages((prev) => [...prev, newMessage]);
    setInput(""); // Clear input field
  
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
  
      const data = await res.json(); // Parse response
  
      if (!res.ok) {
        console.warn("⚠ Server error ignored");
        return;
      }  
  
    } catch (error) {
      console.error("❌ Network error:", error);
    }
  };

  
  return (
    <div className="flex flex-col items-center justify-center border-2 border-gray-300 rounded-md">
      <div className="flex flex-col h-[87vh] w-full bg-white rounded-md overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gray-100 text-black px-4 pt-2 font-bold text-lg">Group Chat</div>
        <div className="bg-gray-100 px-4 pb-2 text-lg">5 online</div>
  
        {/* Messages Container (Auto-scroll to bottom) */}
        <div
          className="flex-1 overflow-y-auto flex flex-col p-4 space-y-2"
          ref={(el) => el?.scrollTo(0, el.scrollHeight)} // Auto-scroll to latest message
        >

          {messages
          .filter(msg => msg.message && msg.message.trim() !== "")
          .map((msg, index) => (
            <div
              key={msg.id || index}
              className={`p-2 max-w-[75%] rounded-lg ${
                msg.name === username
                  ? "bg-green-500 text-white self-end"
                  : "bg-gray-200 text-black self-start"
              }`}
            >
              <p className="text-xs font-semibold">{msg.name}</p>
              <p>{msg.message}</p>
            </div>
          ))}
        </div>
  
        {/* Input Field */}
        <div className="flex items-center gap-2 p-3 border-t">
          <input
            type="text"
            className="flex-1 p-2 border rounded-full focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-full"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
  
}
