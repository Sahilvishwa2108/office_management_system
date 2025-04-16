import { NextRequest } from "next/server";
import { subRedis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const messageHandler = (channel: string, message: string) => {
        if (channel === "chat_messages") {
          try {
            controller.enqueue(`data: ${message}\n\n`);
          } catch (err) {
            console.error("❌ Error enqueuing message:", err);
          }
        }
      };
      

      subRedis.subscribe("chat_messages", (err, count) => {
        if (err) {
          console.error("❌ Redis subscription failed:", err);
          return;
        }
        console.log(`✅ Subscribed to chat_messages channel with ${count} subscribers`);
      });
      
      subRedis.on("close", () => console.warn("⚠ Redis subscriber connection closed. Reconnecting..."));
      subRedis.on("end", () => console.warn("⚠ Redis subscriber connection ended. Reconnecting..."));

      subRedis.on("message", messageHandler);

      // 🔥 Keep the connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({"type": "heartbeat"})}\n\n`);
      }, 30000); // Every 30 sec

      req.signal?.addEventListener("abort", () => {
        clearInterval(keepAlive);
      
        subRedis.unsubscribe("chat_messages").catch(console.error);
        subRedis.off("message", messageHandler);
      
        if (controller) {
          try {
            controller.close();
          } catch (err) {
            console.error("❌ Error closing stream:", err);
          }
        }
      });
      
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
