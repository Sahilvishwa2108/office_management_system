import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { WebhookEvent } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")
  
  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 })
  }
  
  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)
  
  // Get the webhook secret from environment variable
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return new NextResponse("Webhook secret not set", { status: 500 })
  }
  
  // Create a new Webhook instance with your secret
  const webhook = new Webhook(secret)
  
  let event: WebhookEvent
  
  try {
    // Verify the webhook
    event = webhook.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new NextResponse("Error verifying webhook", { status: 400 })
  }
  
  // Handle the webhook event
  const eventType = event.type
  
  try {
    switch (eventType) {
      case "user.created":
      case "user.updated":
        const { id, email_addresses, first_name, last_name, unsafe_metadata } = event.data
        
        // Only process if we have the necessary user data
        if (id && email_addresses && email_addresses.length > 0) {
          const primaryEmail = email_addresses[0].email_address
          const fullName = `${first_name || ''} ${last_name || ''}`.trim()
          const role = unsafe_metadata?.role as string
          
          // Only sync users that have completed onboarding (have role)
          if (role) {
            const existingUser = await prisma.user.findUnique({
              where: { clerkId: id },
            })
            
            if (existingUser) {
              // Update existing user
              await prisma.user.update({
                where: { clerkId: id },
                data: {
                  name: fullName,
                  email: primaryEmail,
                  role: role as any,
                },
              })
            } else {
              // Create new user
              await prisma.user.create({
                data: {
                  clerkId: id,
                  name: fullName,
                  email: primaryEmail,
                  role: role as any,
                },
              })
            }
          }
        }
        break
        
      case "user.deleted":
        // Delete the user from our database
        await prisma.user.delete({
          where: { clerkId: event.data.id },
        }).catch(() => {
          // Ignore if user doesn't exist
        })
        break
        
      default:
        // Ignore other event types
        break
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}