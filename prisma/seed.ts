import { PrismaClient, UserRole, TaskStatus, TaskPriority, BillingStatus } from '@prisma/client'
import { hash } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { v2 as cloudinary } from 'cloudinary'

const prisma = new PrismaClient()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dar1v71xk',
  api_key: process.env.CLOUDINARY_API_KEY || '856333556323653',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'PntG4lFTeOS3QD8w_oUdggqOOrI',
  secure: true,
})

// Redis client - handle Redis connection gracefully
let redis: any = null
try {
  const Redis = require('ioredis')
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
    retryDelayOnFailover: 100,
    lazyConnect: true
  })
} catch (error) {
  console.warn('Redis not available, skipping chat sync')
}

// Professional Indian profile images that we'll upload to Cloudinary
const profileImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
]

// Function to upload image to Cloudinary
async function uploadToCloudinary(imageUrl: string, publicId: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: 'office_management/avatar',
      transformation: [
        { width: 150, height: 150, crop: 'fill', gravity: 'face' },
        { quality: 'auto', format: 'auto' }
      ]
    })
    return result.secure_url
  } catch (error) {
    console.warn(`Failed to upload avatar ${publicId}:`, error)
    return imageUrl // Fallback to original URL
  }
}

async function clearDatabase() {
  console.log('🗑️ Clearing existing data...')
  
  // Delete in correct order to avoid foreign key constraints
  await prisma.activity.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.taskComment.deleteMany()
  await prisma.taskAssignee.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.credential.deleteMany()
  await prisma.clientHistory.deleteMany()
  await prisma.task.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ Database cleared successfully')
}

async function createUsers() {
  console.log('👥 Creating users with Cloudinary avatars...')
  
  const users = [
    {
      id: uuidv4(),
      name: 'Rajesh Kumar Sharma',
      email: 'admin@office-pilot.com',
      password: 'Admin@123',
      role: UserRole.ADMIN,
      phone: '+91-9876543210',
      canApproveBilling: true
    },
    {
      id: uuidv4(),
      name: 'Priya Patel',
      email: 'partner@office-pilot.com',
      password: 'Partner@123',
      role: UserRole.PARTNER,
      phone: '+91-9876543211',
      canApproveBilling: true
    },
    {
      id: uuidv4(),
      name: 'Amit Singh',
      email: 'executive@office-pilot.com',
      password: 'Executive@123',
      role: UserRole.BUSINESS_EXECUTIVE,
      phone: '+91-9876543212',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Vikram Malhotra',
      email: 'executive2@office-pilot.com',
      password: 'Executive@123',
      role: UserRole.BUSINESS_EXECUTIVE,
      phone: '+91-9876543213',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Sneha Gupta',
      email: 'consultant1@office-pilot.com',
      password: 'Consultant@123',
      role: UserRole.BUSINESS_CONSULTANT,
      phone: '+91-9876543214',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Arjun Reddy',
      email: 'consultant2@office-pilot.com',
      password: 'Consultant@123',
      role: UserRole.BUSINESS_CONSULTANT,
      phone: '+91-9876543215',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Kavya Nair',
      email: 'consultant3@office-pilot.com',
      password: 'Consultant@123',
      role: UserRole.BUSINESS_CONSULTANT,
      phone: '+91-9876543216',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Rohit Verma',
      email: 'consultant4@office-pilot.com',
      password: 'Consultant@123',
      role: UserRole.BUSINESS_CONSULTANT,
      phone: '+91-9876543217',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Anita Sharma',
      email: 'manager@office-pilot.com',
      password: 'Manager@123',
      role: UserRole.PARTNER,
      phone: '+91-9876543218',
      canApproveBilling: true
    },
    {
      id: uuidv4(),
      name: 'Ravi Kumar',
      email: 'executive3@office-pilot.com',
      password: 'Executive@123',
      role: UserRole.BUSINESS_EXECUTIVE,
      phone: '+91-9876543219',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Deepika Singh',
      email: 'consultant5@office-pilot.com',
      password: 'Consultant@123',
      role: UserRole.BUSINESS_CONSULTANT,
      phone: '+91-9876543220',
      canApproveBilling: false
    },
    {
      id: uuidv4(),
      name: 'Karthik Iyer',
      email: 'consultant6@office-pilot.com',
      password: 'Consultant@123',
      role: UserRole.BUSINESS_CONSULTANT,
      phone: '+91-9876543221',
      canApproveBilling: false
    }
  ]
  
  const createdUsers: any[] = []
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const hashedPassword = await hash(user.password, 12)
    
    // Upload avatar to Cloudinary
    console.log(`Uploading avatar for ${user.name}...`)
    const avatarUrl = await uploadToCloudinary(
      profileImages[i % profileImages.length],
      `user_${user.id.slice(0, 8)}`
    )
    
    const createdUser = await prisma.user.create({
      data: {
        ...user,
        password: hashedPassword,
        email: user.email.toLowerCase(),
        avatar: avatarUrl
      }
    })
    createdUsers.push(createdUser)
  }
  
  console.log(`✅ Created ${createdUsers.length} users with Cloudinary avatars`)
  return createdUsers
}

async function createClients(users: any[]) {
  console.log('🏢 Creating clients...')
  
  const managers = users.filter(u => ['ADMIN', 'PARTNER', 'BUSINESS_EXECUTIVE'].includes(u.role))
  
  const clients = [
    {
      id: uuidv4(),
      contactPerson: 'Suresh Agarwal',
      companyName: 'TechnoSoft Solutions Pvt Ltd',
      email: 'suresh@technosoft.in',
      phone: '+91-9123456789',
      address: 'Cyber City, Sector 24, Gurgaon, Haryana 122002',
      notes: 'Leading IT services company specializing in enterprise solutions. GST registered business.',
      gstin: '06AABCT1234Q1Z8',
      isGuest: false,
      managerId: managers[0].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Meera Krishnan',
      companyName: 'Digital Marketing Hub India',
      email: 'meera@dmhindia.com',
      phone: '+91-9234567890',
      address: 'Koramangala, 5th Block, Bangalore, Karnataka 560095',
      notes: 'Full-service digital marketing agency with expertise in social media and performance marketing.',
      gstin: '29AABCD5678P1Z2',
      isGuest: false,
      managerId: managers[1].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Rakesh Joshi',
      companyName: 'Joshi Business Consultancy',
      email: 'rakesh@joshiconsult.in',
      phone: '+91-9345678901',
      address: 'Andheri East, Mumbai, Maharashtra 400069',
      notes: 'Business strategy and financial consulting firm. Handles multiple SME clients.',
      gstin: '27AABCJ9876Q1Z5',
      isGuest: false,
      managerId: managers[2].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Ananya Reddy',
      companyName: 'Green Tech Innovations',
      email: 'ananya@greentech.co.in',
      phone: '+91-9456789012',
      address: 'HITEC City, Hyderabad, Telangana 500081',
      notes: 'Renewable energy solutions and cleantech startup. Growing rapidly in South India.',
      gstin: '36AABCG4567R1Z9',
      isGuest: false,
      managerId: managers[0].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Deepak Kumar',
      companyName: 'Kumar Enterprises',
      email: 'deepak@kumarenterprises.in',
      phone: '+91-9567890123',
      address: 'Connaught Place, New Delhi 110001',
      notes: 'Import-export business dealing with electronic goods. Regular client for compliance work.',
      gstin: '07AABCK8901T1Z3',
      isGuest: false,
      managerId: managers[1].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Sita Sharma',
      companyName: 'Sharma Fashion House',
      email: 'sita@sharmafashion.com',
      phone: '+91-9678901234',
      address: 'Commercial Street, Bangalore, Karnataka 560001',
      notes: 'Fashion retail chain with 15 stores across Karnataka. Seasonal business patterns.',
      gstin: '29AABCS7890U1Z6',
      isGuest: false,
      managerId: managers[2].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Rahul Mehta',
      companyName: 'Mehta Construction',
      email: 'rahul@mehtaconstruction.in',
      phone: '+91-9789012345',
      address: 'Bopal, Ahmedabad, Gujarat 380058',
      notes: 'Real estate development and construction company. Multiple ongoing projects.',
      gstin: '24AABCM6789V1Z7',
      isGuest: false,
      managerId: managers[0].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Pooja Malhotra',
      companyName: 'Quick Food Solutions',
      email: 'pooja@quickfood.in',
      phone: '+91-9890123456',
      address: 'Karol Bagh, New Delhi 110005',
      notes: 'Food delivery and catering service. Guest client for temporary project consultation.',
      gstin: '07AABCQ5678W1Z4',
      isGuest: true,
      accessExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      managerId: managers[1].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Manish Agarwal',
      companyName: 'Agarwal Trading Co.',
      email: 'manish@agarwaltrading.com',
      phone: '+91-9991234567',
      address: 'Chandni Chowk, Old Delhi, Delhi 110006',
      notes: 'Traditional wholesale trading business dealing in textiles and garments. Third generation family business.',
      gstin: '07AABCA1234B1Z8',
      isGuest: false,
      managerId: managers[3].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Nisha Kapoor',
      companyName: 'Kapoor Healthcare Solutions',
      email: 'nisha@kapoorhealthcare.in',
      phone: '+91-9882345678',
      address: 'Sector 18, Noida, Uttar Pradesh 201301',
      notes: 'Healthcare technology company developing medical software solutions for hospitals.',
      gstin: '09AABCK5678C1Z2',
      isGuest: false,
      managerId: managers[4].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Ajay Patel',
      companyName: 'Patel Logistics Hub',
      email: 'ajay@patellogistics.co.in',
      phone: '+91-9773456789',
      address: 'Sarkhej, Ahmedabad, Gujarat 382210',
      notes: 'Transportation and logistics company with pan-India network. Specialized in cold chain logistics.',
      gstin: '24AABCP7890D1Z6',
      isGuest: false,
      managerId: managers[2].id
    },
    {
      id: uuidv4(),
      contactPerson: 'Sunita Roy',
      companyName: 'Roy Educational Services',
      email: 'sunita@royeducation.org',
      phone: '+91-9664567890',
      address: 'Salt Lake, Kolkata, West Bengal 700091',
      notes: 'Educational content development and online learning platform. Focus on K-12 curriculum.',
      gstin: '19AABCR8901E1Z3',
      isGuest: false,
      managerId: managers[1].id
    }
  ]
  
  const createdClients: any[] = []
  for (const client of clients) {
    const createdClient = await prisma.client.create({
      data: client
    })
    createdClients.push(createdClient)
  }
  
  console.log(`✅ Created ${createdClients.length} clients`)
  return createdClients
}

async function createTasks(users: any[], clients: any[]) {
  console.log('📋 Creating tasks...')
  
  const tasks = [
    {
      id: uuidv4(),
      title: 'GST Return Filing - Q3 FY24',
      description: 'Complete GST return filing for Q3 FY2024. Includes GSTR-1, GSTR-3B and annual return preparation.',
      status: TaskStatus.completed,
      priority: TaskPriority.high,
      dueDate: new Date('2024-01-31'),
      billingStatus: BillingStatus.paid,
      billingDate: new Date('2024-02-15'),
      assignedById: users[0].id, // Admin
      clientId: clients[0].id,
      lastStatusUpdatedAt: new Date('2024-02-01')
    },
    {
      id: uuidv4(),
      title: 'Digital Marketing Campaign - Festive Season',
      description: 'Design and implement comprehensive digital marketing strategy for Diwali and New Year campaigns. Includes social media, Google Ads, and influencer partnerships.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      dueDate: new Date('2025-01-15'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[1].id, // Partner
      clientId: clients[1].id,
      lastStatusUpdatedAt: new Date('2024-12-20')
    },
    {
      id: uuidv4(),
      title: 'Financial Audit Preparation',
      description: 'Prepare comprehensive financial audit documentation for FY2023-24. Coordinate with CA firm and ensure compliance.',
      status: TaskStatus.review,
      priority: TaskPriority.medium,
      dueDate: new Date('2024-03-31'),
      billingStatus: BillingStatus.billed,
      billingDate: new Date('2024-03-15'),
      assignedById: users[1].id, // Partner
      clientId: clients[2].id,
      lastStatusUpdatedAt: new Date('2024-03-10')
    },
    {
      id: uuidv4(),
      title: 'Solar Panel Installation - Project Management',
      description: 'Oversee solar panel installation project for corporate office. Handle permits, vendor coordination, and timeline management.',
      status: TaskStatus.pending,
      priority: TaskPriority.high,
      dueDate: new Date('2025-02-28'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[0].id, // Admin
      clientId: clients[3].id,
      lastStatusUpdatedAt: new Date('2024-12-01')
    },
    {
      id: uuidv4(),
      title: 'Import License Renewal',
      description: 'Renew import-export license and update DGFT registration. Handle documentation and compliance requirements.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.medium,
      dueDate: new Date('2025-01-30'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[1].id, // Partner
      clientId: clients[4].id,
      lastStatusUpdatedAt: new Date('2024-12-15')
    },
    {
      id: uuidv4(),
      title: 'Retail Store Expansion Analysis',
      description: 'Conduct market research and feasibility study for expanding fashion retail chain to Chennai and Hyderabad markets.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.medium,
      dueDate: new Date('2025-02-15'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[2].id, // Executive
      clientId: clients[5].id,
      lastStatusUpdatedAt: new Date('2024-12-18')
    },
    {
      id: uuidv4(),
      title: 'Construction Project - Environmental Clearance',
      description: 'Obtain environmental clearance for new residential project in Ahmedabad. Handle NOC from pollution board.',
      status: TaskStatus.pending,
      priority: TaskPriority.high,
      dueDate: new Date('2025-03-15'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[0].id, // Admin
      clientId: clients[6].id,
      lastStatusUpdatedAt: new Date('2024-11-25')
    },
    {
      id: uuidv4(),
      title: 'Food License Registration - FSSAI',
      description: 'Complete FSSAI food license registration for new catering business. Handle state and central approvals.',
      status: TaskStatus.completed,
      priority: TaskPriority.low,
      dueDate: new Date('2024-12-31'),
      billingStatus: BillingStatus.paid,
      billingDate: new Date('2025-01-05'),
      assignedById: users[1].id, // Partner
      clientId: clients[7].id,
      lastStatusUpdatedAt: new Date('2024-12-28')
    },
    {
      id: uuidv4(),
      title: 'IT Infrastructure Setup - Cloud Migration',
      description: 'Plan and execute migration of on-premise infrastructure to AWS cloud. Include security audit and performance optimization.',
      status: TaskStatus.review,
      priority: TaskPriority.high,
      dueDate: new Date('2025-01-20'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[0].id, // Admin
      clientId: clients[0].id,
      lastStatusUpdatedAt: new Date('2025-01-02')
    },
    {
      id: uuidv4(),
      title: 'Brand Identity Design - Logo & Marketing Materials',
      description: 'Create complete brand identity package including logo design, business cards, letterheads, and digital marketing templates.',
      status: TaskStatus.cancelled,
      priority: TaskPriority.low,
      dueDate: new Date('2024-11-30'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[1].id, // Partner
      clientId: clients[1].id,
      lastStatusUpdatedAt: new Date('2024-11-15')
    },
    // Additional 10+ tasks for variety
    {
      id: uuidv4(),
      title: 'Textile Business - GST Compliance Audit',
      description: 'Comprehensive GST compliance audit for traditional textile trading business. Review past 3 years transactions.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.medium,
      dueDate: new Date('2025-02-10'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[8].id, // Manager
      clientId: clients[8].id,
      lastStatusUpdatedAt: new Date('2025-01-01')
    },
    {
      id: uuidv4(),
      title: 'Healthcare Software - ISO Certification',
      description: 'Assist in obtaining ISO 27001 certification for healthcare technology platform. Handle documentation and compliance.',
      status: TaskStatus.pending,
      priority: TaskPriority.high,
      dueDate: new Date('2025-03-31'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[9].id, // Executive3
      clientId: clients[9].id,
      lastStatusUpdatedAt: new Date('2024-12-30')
    },
    {
      id: uuidv4(),
      title: 'Logistics Hub - Transport License Renewal',
      description: 'Renew all transport permits and licenses for logistics operations across multiple states.',
      status: TaskStatus.completed,
      priority: TaskPriority.medium,
      dueDate: new Date('2024-12-15'),
      billingStatus: BillingStatus.paid,
      billingDate: new Date('2024-12-20'),
      assignedById: users[2].id, // Executive
      clientId: clients[10].id,
      lastStatusUpdatedAt: new Date('2024-12-16')
    },
    {
      id: uuidv4(),
      title: 'Educational Platform - Content Compliance Review',
      description: 'Review educational content for compliance with CBSE and state board guidelines. Ensure age-appropriate content.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.low,
      dueDate: new Date('2025-02-28'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[1].id, // Partner
      clientId: clients[11].id,
      lastStatusUpdatedAt: new Date('2025-01-03')
    },
    {
      id: uuidv4(),
      title: 'Digital Payment Integration - TechnoSoft',
      description: 'Integrate Razorpay and UPI payment gateways into existing ERP system. Handle PCI compliance requirements.',
      status: TaskStatus.review,
      priority: TaskPriority.high,
      dueDate: new Date('2025-01-25'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[0].id, // Admin
      clientId: clients[0].id,
      lastStatusUpdatedAt: new Date('2025-01-05')
    },
    {
      id: uuidv4(),
      title: 'Social Media Analytics Dashboard',
      description: 'Build comprehensive analytics dashboard for tracking social media performance across all platforms.',
      status: TaskStatus.pending,
      priority: TaskPriority.medium,
      dueDate: new Date('2025-02-20'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[1].id, // Partner
      clientId: clients[1].id,
      lastStatusUpdatedAt: new Date('2024-12-28')
    },
    {
      id: uuidv4(),
      title: 'Business Loan Application Support',
      description: 'Assist with MSME loan application process. Prepare financial projections and business plan documentation.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      dueDate: new Date('2025-01-18'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[1].id, // Partner
      clientId: clients[2].id,
      lastStatusUpdatedAt: new Date('2025-01-04')
    },
    {
      id: uuidv4(),
      title: 'Green Energy Subsidy Applications',
      description: 'Apply for government subsidies and incentives for solar panel installation projects.',
      status: TaskStatus.completed,
      priority: TaskPriority.medium,
      dueDate: new Date('2024-11-30'),
      billingStatus: BillingStatus.billed,
      billingDate: new Date('2024-12-05'),
      assignedById: users[0].id, // Admin
      clientId: clients[3].id,
      lastStatusUpdatedAt: new Date('2024-12-01')
    },
    {
      id: uuidv4(),
      title: 'E-commerce Platform Setup',
      description: 'Set up complete e-commerce platform for fashion retail business. Include payment gateway and inventory management.',
      status: TaskStatus.in_progress,
      priority: TaskPriority.high,
      dueDate: new Date('2025-02-14'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[2].id, // Executive
      clientId: clients[5].id,
      lastStatusUpdatedAt: new Date('2025-01-02')
    },
    {
      id: uuidv4(),
      title: 'Construction Safety Audit',
      description: 'Conduct comprehensive safety audit for ongoing construction projects. Ensure compliance with labor laws.',
      status: TaskStatus.pending,
      priority: TaskPriority.high,
      dueDate: new Date('2025-01-31'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[0].id, // Admin
      clientId: clients[6].id,
      lastStatusUpdatedAt: new Date('2024-12-20')
    },
    {
      id: uuidv4(),
      title: 'Mobile App Development - Food Delivery',
      description: 'Develop mobile application for food delivery service. Include real-time tracking and payment integration.',
      status: TaskStatus.cancelled,
      priority: TaskPriority.medium,
      dueDate: new Date('2024-12-31'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[1].id, // Partner
      clientId: clients[7].id,
      lastStatusUpdatedAt: new Date('2024-11-20')
    },
    {
      id: uuidv4(),
      title: 'Supply Chain Optimization',
      description: 'Analyze and optimize supply chain processes for logistics company. Implement IoT tracking solutions.',
      status: TaskStatus.review,
      priority: TaskPriority.medium,
      dueDate: new Date('2025-03-10'),
      billingStatus: BillingStatus.pending_billing,
      assignedById: users[2].id, // Executive
      clientId: clients[10].id,
      lastStatusUpdatedAt: new Date('2025-01-06')
    }
  ]
  
  const createdTasks: any[] = []
  for (const task of tasks) {
    const createdTask = await prisma.task.create({
      data: task
    })
    createdTasks.push(createdTask)
  }
  
  console.log(`✅ Created ${createdTasks.length} tasks`)
  return createdTasks
}

async function createTaskAssignments(users: any[], tasks: any[]) {
  console.log('👥 Creating task assignments...')
  
  const assignments = [
    // GST Return Filing
    { taskId: tasks[0].id, userId: users[4].id }, // Sneha Gupta
    { taskId: tasks[0].id, userId: users[5].id }, // Arjun Reddy
    
    // Digital Marketing Campaign
    { taskId: tasks[1].id, userId: users[2].id }, // Amit Singh
    { taskId: tasks[1].id, userId: users[6].id }, // Kavya Nair
    
    // Financial Audit
    { taskId: tasks[2].id, userId: users[4].id }, // Sneha Gupta
    
    // Solar Panel Installation
    { taskId: tasks[3].id, userId: users[3].id }, // Vikram Malhotra
    { taskId: tasks[3].id, userId: users[7].id }, // Rohit Verma
    
    // Import License Renewal
    { taskId: tasks[4].id, userId: users[5].id }, // Arjun Reddy
    
    // Retail Store Expansion
    { taskId: tasks[5].id, userId: users[6].id }, // Kavya Nair
    { taskId: tasks[5].id, userId: users[7].id }, // Rohit Verma
    
    // Environmental Clearance
    { taskId: tasks[6].id, userId: users[3].id }, // Vikram Malhotra
    
    // Food License Registration
    { taskId: tasks[7].id, userId: users[7].id }, // Rohit Verma
    
    // IT Infrastructure Setup
    { taskId: tasks[8].id, userId: users[2].id }, // Amit Singh
    { taskId: tasks[8].id, userId: users[4].id }, // Sneha Gupta
    
    // Brand Identity Design
    { taskId: tasks[9].id, userId: users[6].id }, // Kavya Nair
  ]
  
  for (const assignment of assignments) {
    await prisma.taskAssignee.create({
      data: {
        id: uuidv4(),
        ...assignment
      }
    })
  }
  
  console.log(`✅ Created ${assignments.length} task assignments`)
}

async function createMessages(users: any[]) {
  console.log('💬 Creating chat messages and syncing with Redis...')
  
  const messages = [
    {
      id: uuidv4(),
      content: 'Good morning team! Hope everyone had a great weekend. Let\'s make this week productive! 🚀',
      senderId: users[0].id, // Rajesh (Admin)
      createdAt: new Date('2024-12-23T09:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'Hi Rajesh! Absolutely, I\'ve already started working on the TechnoSoft GST documentation. Should have the draft ready by EOD.',
      senderId: users[4].id, // Sneha Gupta
      createdAt: new Date('2024-12-23T09:18:00Z')
    },
    {
      id: uuidv4(),
      content: 'Great progress on the digital marketing campaign! The client loved our festive season strategy. Meera from DMH India was particularly impressed with our Diwali content ideas.',
      senderId: users[2].id, // Amit Singh
      createdAt: new Date('2024-12-23T10:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Just finished the client call with Green Tech Innovations. They want to fast-track the solar panel project. Can we schedule a team meeting to discuss resource allocation?',
      senderId: users[3].id, // Vikram Malhotra
      createdAt: new Date('2024-12-23T11:45:00Z')
    },
    {
      id: uuidv4(),
      content: 'Sure Vikram! I\'ll send out calendar invites for this afternoon. Also, Arjun, how\'s the import license renewal coming along for Kumar Enterprises?',
      senderId: users[1].id, // Priya Patel
      createdAt: new Date('2024-12-23T12:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'It\'s going well Priya! Just waiting for the DGFT portal to process the updated documents. Should be cleared by tomorrow. Deepak Kumar has been very cooperative with providing all required paperwork.',
      senderId: users[5].id, // Arjun Reddy
      createdAt: new Date('2024-12-23T12:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'Excellent teamwork everyone! BTW, Kavya, how\'s the market research for Sharma Fashion House going? Any interesting insights from the South Indian market analysis?',
      senderId: users[0].id, // Admin
      createdAt: new Date('2024-12-23T14:20:00Z')
    },
    {
      id: uuidv4(),
      content: 'Really exciting findings Rajesh! The Chennai market shows 35% higher demand for ethnic wear compared to Bangalore. Hyderabad has strong potential for fusion collections. Rohit has been helping with competitor analysis.',
      senderId: users[6].id, // Kavya Nair
      createdAt: new Date('2024-12-23T14:25:00Z')
    },
    {
      id: uuidv4(),
      content: 'Thanks for the mention Kavya! Yes, the competitor landscape in Hyderabad is quite favorable. Also, just completed the FSSAI registration for Quick Food Solutions. Pooja was thrilled with how quickly we handled it.',
      senderId: users[7].id, // Rohit Verma
      createdAt: new Date('2024-12-23T15:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Fantastic work Rohit! Quick turnaround times like this really help build our reputation. Speaking of which, the AWS migration for TechnoSoft is in final review stage. Should be deploying this weekend.',
      senderId: users[2].id, // Amit Singh
      createdAt: new Date('2024-12-23T16:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'Perfect timing Amit! And great news - Mehta Construction just approved the environmental clearance project scope. Vikram, you\'ll be leading this one. It\'s a significant project for us.',
      senderId: users[0].id, // Admin
      createdAt: new Date('2024-12-23T16:45:00Z')
    },
    {
      id: uuidv4(),
      content: 'Honored to lead this project! Environmental clearances can be complex, but I\'ve worked with Gujarat pollution board before. Will start with the preliminary documentation tomorrow.',
      senderId: users[3].id, // Vikram Malhotra
      createdAt: new Date('2024-12-23T16:50:00Z')
    },
    {
      id: uuidv4(),
      content: 'Before we wrap up today - reminder that we have the monthly client review meeting this Friday. I\'ll be presenting our Q4 achievements and Q1 roadmap. Great work everyone! 👏',
      senderId: users[1].id, // Priya Patel
      createdAt: new Date('2024-12-23T17:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Looking forward to it Priya! This has been our best quarter yet. The team\'s dedication really shows in our client satisfaction scores. Have a great evening everyone! 🌟',
      senderId: users[0].id, // Admin
      createdAt: new Date('2024-12-23T17:35:00Z')
    },
    // Additional messages for more variety
    {
      id: uuidv4(),
      content: 'Good morning team! New year, new goals! 🎯 Let\'s kick off 2025 with some exciting updates. We have 3 new clients onboarding this month.',
      senderId: users[8].id, // Anita Sharma
      createdAt: new Date('2025-01-02T09:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'Happy New Year Anita! Excited to work with the new clients. I\'ve prepared onboarding packages for Agarwal Trading and Kapoor Healthcare. When can we schedule the kickoff meetings?',
      senderId: users[9].id, // Ravi Kumar
      createdAt: new Date('2025-01-02T09:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'The healthcare compliance requirements for Kapoor Healthcare are quite extensive. I\'ve been researching ISO 27001 standards. We might need to bring in a specialized consultant.',
      senderId: users[10].id, // Deepika Singh
      createdAt: new Date('2025-01-02T10:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Good point Deepika! I have contacts at TUV India who specialize in healthcare ISO certifications. Let me connect you with them this week.',
      senderId: users[1].id, // Priya Patel
      createdAt: new Date('2025-01-02T11:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'Update on Patel Logistics: Their cold chain operations need specialized transport permits. Karthik, since you\'re handling their account, can you coordinate with RTO offices in Gujarat and Maharashtra?',
      senderId: users[2].id, // Amit Singh
      createdAt: new Date('2025-01-02T14:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'Absolutely Amit! I\'ve already started the paperwork. The cold chain permits require additional safety certifications. Expected timeline is 3-4 weeks for complete approval.',
      senderId: users[11].id, // Karthik Iyer
      createdAt: new Date('2025-01-02T14:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Roy Educational Services wants to expand their content library. They\'re looking for NCERT alignment certification. This could be a big opportunity for recurring revenue.',
      senderId: users[6].id, // Kavya Nair
      createdAt: new Date('2025-01-03T11:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'That\'s excellent Kavya! Educational content compliance is a growing market. We should consider building a dedicated team for EdTech clients. What do you think Rajesh?',
      senderId: users[1].id, // Priya Patel
      createdAt: new Date('2025-01-03T11:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'I agree Priya! The EdTech sector is booming in India. Let\'s discuss this in our next strategy meeting. We could potentially capture 15-20% of the compliance market in this space.',
      senderId: users[0].id, // Rajesh (Admin)
      createdAt: new Date('2025-01-03T12:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'Just wrapped up the textile compliance audit for Agarwal Trading. Found some minor GST filing discrepancies from 2022. Nothing major, but we should file revised returns.',
      senderId: users[10].id, // Deepika Singh
      createdAt: new Date('2025-01-04T15:45:00Z')
    },
    {
      id: uuidv4(),
      content: 'Good catch Deepika! Traditional businesses often have these historical issues. Let\'s schedule a client education session about modern GST compliance tools.',
      senderId: users[8].id, // Anita Sharma
      createdAt: new Date('2025-01-04T16:00:00Z')
    }
  ]
  
  // Store messages in database
  for (const message of messages) {
    await prisma.message.create({
      data: message
    })
  }
  
  // Sync messages to Redis for real-time chat
  try {
    console.log('Syncing messages to Redis...')
    for (const message of messages) {
      const user = users.find(u => u.id === message.senderId)
      const redisMessage = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: user?.name || 'Unknown',
        senderAvatar: user?.avatar || null,
        createdAt: message.createdAt.toISOString(),
        timestamp: message.createdAt.getTime()
      }
      
      // Add to Redis chat stream
      try {
        if (redis) {
          await redis.zadd('chat:messages', message.createdAt.getTime(), JSON.stringify(redisMessage))
        }
      } catch (redisError) {
        console.warn('Redis sync failed for message:', redisError)
      }
    }
    
    // Set chat room info
    try {
      if (redis) {
        await redis.hset('chat:room:general', {
          name: 'General Chat',
          description: 'Office team general discussion',
          memberCount: users.length,
          lastActivity: new Date().toISOString()
        })
        console.log('✅ Messages synced to Redis successfully')
      } else {
        console.log('⚠️ Redis not available, messages created in database only')
      }
    } catch (redisError) {
      console.warn('Redis room setup failed:', redisError)
    }
  } catch (error) {
    console.warn('Failed to sync messages to Redis:', error)
  }
  
  console.log(`✅ Created ${messages.length} chat messages`)
}

async function createTaskComments(users: any[], tasks: any[]) {
  console.log('💭 Creating task comments...')
  
  const comments = [
    {
      id: uuidv4(),
      content: 'GST returns completed and filed successfully. All supporting documents have been uploaded to the client portal.',
      taskId: tasks[0].id,
      userId: users[4].id, // Sneha Gupta
      createdAt: new Date('2024-02-01T14:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Festive campaign creative assets are ready. Need client approval before we proceed with media buying.',
      taskId: tasks[1].id,
      userId: users[6].id, // Kavya Nair
      createdAt: new Date('2024-12-20T11:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'Financial audit documentation is 90% complete. Just waiting for bank statement reconciliation from the client.',
      taskId: tasks[2].id,
      userId: users[4].id, // Sneha Gupta
      createdAt: new Date('2024-03-10T16:20:00Z')
    },
    {
      id: uuidv4(),
      content: 'Solar panel project timeline needs revision. Client wants to accelerate installation by 2 weeks.',
      taskId: tasks[3].id,
      userId: users[3].id, // Vikram Malhotra
      createdAt: new Date('2024-12-15T09:45:00Z')
    },
    {
      id: uuidv4(),
      content: 'DGFT portal is showing processing delays. Expected clearance by end of this week.',
      taskId: tasks[4].id,
      userId: users[5].id, // Arjun Reddy
      createdAt: new Date('2024-12-18T13:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Market research survey completed. Chennai shows promising demographics for expansion.',
      taskId: tasks[5].id,
      userId: users[7].id, // Rohit Verma
      createdAt: new Date('2024-12-22T10:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'Environmental consultant meeting scheduled for next week. Initial site assessment looks positive.',
      taskId: tasks[6].id,
      userId: users[3].id, // Vikram Malhotra
      createdAt: new Date('2024-12-01T15:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'FSSAI license approved! Client can now start food operations legally.',
      taskId: tasks[7].id,
      userId: users[7].id, // Rohit Verma
      createdAt: new Date('2024-12-28T12:45:00Z')
    },
    {
      id: uuidv4(),
      content: 'AWS migration testing phase completed successfully. Ready for production deployment.',
      taskId: tasks[8].id,
      userId: users[2].id, // Amit Singh
      createdAt: new Date('2025-01-02T14:20:00Z')
    },
    {
      id: uuidv4(),
      content: 'Project cancelled due to client budget constraints. Will invoice for work completed so far.',
      taskId: tasks[9].id,
      userId: users[1].id, // Priya Patel
      createdAt: new Date('2024-11-15T11:30:00Z')
    }
  ]
  
  for (const comment of comments) {
    await prisma.taskComment.create({
      data: comment
    })
  }
  
  console.log(`✅ Created ${comments.length} task comments`)
}

async function createNotifications(users: any[], tasks: any[]) {
  console.log('🔔 Creating notifications...')
  
  const notifications = [
    {
      id: uuidv4(),
      title: 'Task Completed',
      content: 'GST Return Filing - Q3 FY24 has been completed successfully',
      isRead: true,
      sentById: users[4].id, // Sneha Gupta
      sentToId: users[0].id, // Admin
      createdAt: new Date('2024-02-01T14:35:00Z')
    },
    {
      id: uuidv4(),
      title: 'High Priority Task Due Soon',
      content: 'Digital Marketing Campaign - Festive Season is due in 3 days',
      isRead: false,
      sentById: users[0].id, // Admin
      sentToId: users[2].id, // Amit Singh
      createdAt: new Date('2025-01-12T09:00:00Z')
    },
    {
      id: uuidv4(),
      title: 'Task Under Review',
      content: 'Financial Audit Preparation is now under review',
      isRead: true,
      sentById: users[4].id, // Sneha Gupta
      sentToId: users[1].id, // Priya Patel
      createdAt: new Date('2024-03-10T16:25:00Z')
    },
    {
      id: uuidv4(),
      title: 'New Task Assigned',
      content: 'Solar Panel Installation - Project Management has been assigned to you',
      isRead: false,
      sentById: users[0].id, // Admin
      sentToId: users[3].id, // Vikram Malhotra
      createdAt: new Date('2024-12-01T10:00:00Z')
    },
    {
      id: uuidv4(),
      title: 'Task Status Updated',
      content: 'Import License Renewal status updated to In Progress',
      isRead: true,
      sentById: users[5].id, // Arjun Reddy
      sentToId: users[1].id, // Priya Patel
      createdAt: new Date('2024-12-15T08:30:00Z')
    },
    {
      id: uuidv4(),
      title: 'Billing Approved',
      content: 'Task billing for GST Return Filing has been approved',
      isRead: true,
      sentById: users[0].id, // Admin
      sentToId: users[4].id, // Sneha Gupta
      createdAt: new Date('2024-02-15T11:00:00Z')
    },
    {
      id: uuidv4(),
      title: 'Task Cancelled',
      content: 'Brand Identity Design project has been cancelled by client',
      isRead: true,
      sentById: users[1].id, // Priya Patel
      sentToId: users[6].id, // Kavya Nair
      createdAt: new Date('2024-11-15T11:35:00Z')
    },
    {
      id: uuidv4(),
      title: 'Guest Client Access Expiring',
      content: 'Quick Food Solutions guest access expires in 7 days',
      isRead: false,
      sentById: users[0].id, // Admin
      sentToId: users[1].id, // Priya Patel
      createdAt: new Date('2025-01-20T09:00:00Z')
    }
  ]
  
  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification
    })
  }
  
  console.log(`✅ Created ${notifications.length} notifications`)
}

async function createActivities(users: any[], tasks: any[], clients: any[]) {
  console.log('📊 Creating activity logs...')
  
  const activities = [
    {
      id: uuidv4(),
      type: 'task',
      action: 'completed',
      target: 'GST Return Filing - Q3 FY24',
      details: { taskId: tasks[0].id, clientName: 'TechnoSoft Solutions' },
      userId: users[4].id, // Sneha Gupta
      createdAt: new Date('2024-02-01T14:30:00Z')
    },
    {
      id: uuidv4(),
      type: 'client',
      action: 'created',
      target: 'Digital Marketing Hub India',
      details: { clientId: clients[1].id },
      userId: users[1].id, // Priya Patel
      createdAt: new Date('2024-11-15T10:00:00Z')
    },
    {
      id: uuidv4(),
      type: 'task',
      action: 'updated',
      target: 'Financial Audit Preparation',
      details: { taskId: tasks[2].id, status: 'review' },
      userId: users[4].id, // Sneha Gupta
      createdAt: new Date('2024-03-10T16:20:00Z')
    },
    {
      id: uuidv4(),
      type: 'user',
      action: 'created',
      target: 'Vikram Malhotra',
      details: { userId: users[3].id, role: 'Business Executive' },
      userId: users[0].id, // Admin
      createdAt: new Date('2024-10-01T09:00:00Z')
    },
    {
      id: uuidv4(),
      type: 'task',
      action: 'assigned',
      target: 'Solar Panel Installation',
      details: { taskId: tasks[3].id, assignees: ['Vikram Malhotra', 'Rohit Verma'] },
      userId: users[0].id, // Admin
      createdAt: new Date('2024-12-01T10:05:00Z')
    },
    {
      id: uuidv4(),
      type: 'task',
      action: 'updated',
      target: 'GST Return Filing - Q3 FY24',
      details: { taskId: tasks[0].id, billingStatus: 'paid' },
      userId: users[0].id, // Admin
      createdAt: new Date('2024-02-15T11:00:00Z')
    },
    {
      id: uuidv4(),
      type: 'task',
      action: 'cancelled',
      target: 'Brand Identity Design',
      details: { taskId: tasks[9].id, reason: 'budget constraints' },
      userId: users[1].id, // Priya Patel
      createdAt: new Date('2024-11-15T11:30:00Z')
    },
    {
      id: uuidv4(),
      type: 'client',
      action: 'updated',
      target: 'Green Tech Innovations',
      details: { clientId: clients[3].id, field: 'contact information' },
      userId: users[0].id, // Admin
      createdAt: new Date('2024-12-10T14:15:00Z')
    },
    {
      id: uuidv4(),
      type: 'task',
      action: 'created',
      target: 'IT Infrastructure Setup - Cloud Migration',
      details: { taskId: tasks[8].id, assignee: 'Amit Singh' },
      userId: users[0].id, // Admin
      createdAt: new Date('2024-11-20T11:30:00Z')
    },
    {
      id: uuidv4(),
      type: 'task',
      action: 'updated',
      target: 'FSSAI License Registration',
      details: { taskId: tasks[7].id, action: 'comment added' },
      userId: users[7].id, // Rohit Verma
      createdAt: new Date('2024-12-28T12:50:00Z')
    }
  ]
  
  for (const activity of activities) {
    await prisma.activity.create({
      data: activity
    })
  }
  
  console.log(`✅ Created ${activities.length} activity logs`)
}

async function createClientHistories(users: any[], clients: any[]) {
  console.log('📋 Creating client histories...')
  
  const histories = [
    {
      id: uuidv4(),
      content: 'TechnoSoft Solutions Pvt Ltd added as new client',
      type: 'client_created',
      clientId: clients[0].id,
      createdById: users[0].id, // Admin
      createdAt: new Date('2024-01-15T10:00:00Z')
    },
    {
      id: uuidv4(),
      content: 'Client manager changed from Priya Patel to Rajesh Kumar Sharma',
      type: 'manager_updated',
      clientId: clients[0].id,
      createdById: users[0].id, // Admin
      createdAt: new Date('2024-06-01T14:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Updated phone number for Digital Marketing Hub India from +91-9234567899 to +91-9234567890',
      type: 'contact_updated',
      clientId: clients[1].id,
      createdById: users[1].id, // Priya Patel
      createdAt: new Date('2024-08-15T11:20:00Z')
    },
    {
      id: uuidv4(),
      content: 'Updated GSTIN for Joshi Business Consultancy to 27AABCJ9876Q1Z5',
      type: 'gst_updated',
      clientId: clients[2].id,
      createdById: users[2].id, // Amit Singh
      createdAt: new Date('2024-09-20T16:45:00Z')
    },
    {
      id: uuidv4(),
      content: 'Updated office address for Green Tech Innovations to include complete postal details',
      type: 'address_updated',
      clientId: clients[3].id,
      createdById: users[0].id, // Admin
      createdAt: new Date('2024-12-10T14:15:00Z')
    },
    {
      id: uuidv4(),
      content: 'Added detailed business description for Kumar Enterprises including import-export specialization',
      type: 'notes_updated',
      clientId: clients[4].id,
      createdById: users[1].id, // Priya Patel
      createdAt: new Date('2024-11-05T13:30:00Z')
    },
    {
      id: uuidv4(),
      content: 'Quick Food Solutions converted to guest client with 30 days access',
      type: 'status_updated',
      clientId: clients[7].id,
      createdById: users[1].id, // Priya Patel
      createdAt: new Date('2024-12-20T09:00:00Z')
    }
  ]
  
  for (const history of histories) {
    await prisma.clientHistory.create({
      data: history
    })
  }
  
  console.log(`✅ Created ${histories.length} client history entries`)
}

async function createCredentials(clients: any[]) {
  console.log('🔐 Creating credentials...')
  
  const credentials = [
    {
      id: uuidv4(),
      title: 'GST Portal Login',
      username: 'technosoft_gst',
      password: 'GST@2024#Tech',
      clientId: clients[0].id
    },
    {
      id: uuidv4(),
      title: 'Google Ads Account',
      username: 'dmhindia@gmail.com',
      password: 'GoogleAds@DMH2024',
      clientId: clients[1].id
    },
    {
      id: uuidv4(),
      title: 'Banking Portal',
      username: 'joshi_business',
      password: 'HDFC@Joshi123',
      clientId: clients[2].id
    },
    {
      id: uuidv4(),
      title: 'DGFT Portal',
      username: 'kumar_imports',
      password: 'DGFT@Kumar2024',
      clientId: clients[4].id
    },
    {
      id: uuidv4(),
      title: 'Gujarat Pollution Board',
      username: 'mehta_construction',
      password: 'GPCB@Mehta123',
      clientId: clients[6].id
    },
    {
      id: uuidv4(),
      title: 'FSSAI Portal',
      username: 'quickfood_solutions',
      password: 'FSSAI@Quick2024',
      clientId: clients[7].id
    }
  ]
  
  for (const credential of credentials) {
    await prisma.credential.create({
      data: credential
    })
  }
  
  console.log(`✅ Created ${credentials.length} credentials`)
}

async function createAttachments(clients: any[]) {
  console.log('📎 Creating attachments...')
  
  const attachments = [
    {
      id: uuidv4(),
      filename: 'GST_Certificate_TechnoSoft.pdf',
      path: '/uploads/clients/technosoft/gst_certificate.pdf',
      mimetype: 'application/pdf',
      size: 245760, // 240 KB
      clientId: clients[0].id
    },
    {
      id: uuidv4(),
      filename: 'Company_Registration_DMH.pdf',
      path: '/uploads/clients/dmh/company_reg.pdf',
      mimetype: 'application/pdf',
      size: 185324, // 181 KB
      clientId: clients[1].id
    },
    {
      id: uuidv4(),
      filename: 'Audit_Report_2023_Joshi.pdf',
      path: '/uploads/clients/joshi/audit_2023.pdf',
      mimetype: 'application/pdf',
      size: 512000, // 500 KB
      clientId: clients[2].id
    },
    {
      id: uuidv4(),
      filename: 'Solar_Project_Proposal.pdf',
      path: '/uploads/clients/greentech/solar_proposal.pdf',
      mimetype: 'application/pdf',
      size: 1048576, // 1 MB
      clientId: clients[3].id
    },
    {
      id: uuidv4(),
      filename: 'Import_License_Kumar.pdf',
      path: '/uploads/clients/kumar/import_license.pdf',
      mimetype: 'application/pdf',
      size: 156789, // 153 KB
      clientId: clients[4].id
    },
    {
      id: uuidv4(),
      filename: 'Store_Layout_Plans.pdf',
      path: '/uploads/clients/sharma/store_plans.pdf',
      mimetype: 'application/pdf',
      size: 2097152, // 2 MB
      clientId: clients[5].id
    },
    {
      id: uuidv4(),
      filename: 'Environmental_Assessment.pdf',
      path: '/uploads/clients/mehta/env_assessment.pdf',
      mimetype: 'application/pdf',
      size: 756432, // 738 KB
      clientId: clients[6].id
    },
    {
      id: uuidv4(),
      filename: 'FSSAI_Application_Form.pdf',
      path: '/uploads/clients/quickfood/fssai_form.pdf',
      mimetype: 'application/pdf',
      size: 98304, // 96 KB
      clientId: clients[7].id
    }
  ]
  
  for (const attachment of attachments) {
    await prisma.attachment.create({
      data: attachment
    })
  }
  
  console.log(`✅ Created ${attachments.length} attachments`)
}

async function main() {
  console.log('🚀 Starting comprehensive demo data creation...')
  
  // Clear existing data
  await clearDatabase()
  
  // Create all data in sequence
  const users = await createUsers()
  const clients = await createClients(users)
  const tasks = await createTasks(users, clients)
  await createTaskAssignments(users, tasks)
  await createMessages(users)
  await createTaskComments(users, tasks)
  await createNotifications(users, tasks)
  await createActivities(users, tasks, clients)
  await createClientHistories(users, clients)
  await createCredentials(clients)
  await createAttachments(clients)
  
  console.log('🎉 Demo data creation completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   👥 Users: ${users.length} (with Cloudinary avatars)`)
  console.log(`   🏢 Clients: ${clients.length}`)
  console.log(`   📋 Tasks: ${tasks.length}`)
  console.log(`   💬 Messages: 25 (synced with Redis)`)
  console.log(`   💭 Task Comments: 10`)
  console.log(`   🔔 Notifications: 8`)
  console.log(`   📊 Activities: 10`)
  console.log(`   📋 Client Histories: 7`)
  console.log(`   🔐 Credentials: 6`)
  console.log(`   📎 Attachments: 8`)
  console.log('')
  console.log('🔑 Demo Login Accounts:')
  console.log('   Admin: admin@office-pilot.com / Admin@123')
  console.log('   Partner: partner@office-pilot.com / Partner@123')
  console.log('   Manager: manager@office-pilot.com / Manager@123')
  console.log('   Executive: executive@office-pilot.com / Executive@123')
  console.log('   Executive 2: executive2@office-pilot.com / Executive@123')
  console.log('   Executive 3: executive3@office-pilot.com / Executive@123')
  console.log('   Consultant 1: consultant1@office-pilot.com / Consultant@123')
  console.log('   Consultant 2: consultant2@office-pilot.com / Consultant@123')
  console.log('   Consultant 3: consultant3@office-pilot.com / Consultant@123')
  console.log('   Consultant 4: consultant4@office-pilot.com / Consultant@123')
  console.log('   Consultant 5: consultant5@office-pilot.com / Consultant@123')
  console.log('   Consultant 6: consultant6@office-pilot.com / Consultant@123')
  console.log('')
  console.log('🎯 Perfect for demonstration! Your office management system is now loaded with:')
  console.log('   ✅ Comprehensive Indian business data')
  console.log('   ✅ Cloudinary-hosted user avatars')
  console.log('   ✅ Redis-synced chat messages')
  console.log('   ✅ Diverse task statuses and priorities')
  console.log('   ✅ Multiple client types and industries')
  console.log('   ✅ Complete workflow coverage')
}

main()
  .catch(e => {
    console.error('❌ Error during demo data creation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
