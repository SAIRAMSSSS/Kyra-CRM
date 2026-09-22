const path = require('path');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:' + path.join(process.cwd(), 'prisma', 'dev.db');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KYRA CRM database with initial roles, sites, and handwritten sheet reference data...');

  // 1. Clean existing records in reverse dependency order
  await prisma.metaLeadLog.deleteMany();
  await prisma.metaIntegrationConfig.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.siteVisit.deleteMany();
  await prisma.callReport.deleteMany();
  await prisma.leadAssignmentHistory.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.leadSource.deleteMany();
  await prisma.site.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 3. Create Employees with Users & Profiles
  const usersData = [
    {
      email: 'gm@kyra.com',
      name: 'Rajesh Menon',
      role: 'GENERAL_MANAGER',
      code: 'KYRA-GM-001',
      dept: 'Executive Management',
      desig: 'General Manager & Director',
      phone: '+91 98401 11001',
    },
    {
      email: 'digital@kyra.com',
      name: 'Anita Sharma',
      role: 'DIGITAL_HEAD',
      code: 'KYRA-DH-001',
      dept: 'Digital Marketing & Growth',
      desig: 'Head of Digital Marketing',
      phone: '+91 98401 11002',
    },
    {
      email: 'crm@kyra.com',
      name: 'Karthik Verma',
      role: 'CRM_EXECUTIVE',
      code: 'KYRA-CRM-001',
      dept: 'Customer Relationship & Sales',
      desig: 'Senior CRM Operations Executive',
      phone: '+91 98401 11003',
    },
    {
      email: 'site@kyra.com',
      name: 'Suresh Pillai',
      role: 'SITE_MANAGER',
      code: 'KYRA-SM-001',
      dept: 'Site Operations & Logistics',
      desig: 'Regional Site Manager (Pollachi)',
      phone: '+91 98401 11004',
    },
    {
      email: 'site2@kyra.com',
      name: 'Deepa Sundaram',
      role: 'SITE_MANAGER',
      code: 'KYRA-SM-002',
      dept: 'Site Operations & Logistics',
      desig: 'Site Operations Lead (Coimbatore)',
      phone: '+91 98401 11007',
    },
    {
      email: 'telecaller1@kyra.com',
      name: 'Priya Nair',
      role: 'TELECALLER',
      code: 'KYRA-TC-001',
      dept: 'Telecalling Operations',
      desig: 'Senior Telecaller Specialist',
      phone: '+91 98401 11005',
    },
    {
      email: 'telecaller2@kyra.com',
      name: 'Rahul Krishnan',
      role: 'TELECALLER',
      code: 'KYRA-TC-002',
      dept: 'Telecalling Operations',
      desig: 'Customer Relations Associate',
      phone: '+91 98401 11006',
    },
    {
      email: 'telecaller3@kyra.com',
      name: 'Divya Ramesh',
      role: 'TELECALLER',
      code: 'KYRA-TC-003',
      dept: 'Telecalling Operations',
      desig: 'Outbound Specialist',
      phone: '+91 98401 11008',
    },
    {
      email: 'telecaller4@kyra.com',
      name: 'Vigneshwaran K',
      role: 'TELECALLER',
      code: 'KYRA-TC-004',
      dept: 'Telecalling Operations',
      desig: 'Lead Qualification Specialist',
      phone: '+91 98401 11009',
    },
    {
      email: 'telecaller5@kyra.com',
      name: 'Ananya Swaminathan',
      role: 'TELECALLER',
      code: 'KYRA-TC-005',
      dept: 'Telecalling Operations',
      desig: 'Customer Engagement Associate',
      phone: '+91 98401 11010',
    },
  ];

  const createdUsers = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        status: 'ACTIVE',
        profile: {
          create: {
            employeeCode: u.code,
            department: u.dept,
            designation: u.desig,
            phone: u.phone,
            joiningDate: new Date('2024-01-15'),
            status: 'Active',
          },
        },
      },
    });
    createdUsers[u.email] = user;
  }

  console.log(`✅ Created ${usersData.length} employee accounts with roles.`);

  // 4. Create Project Sites
  const sitesData = [
    {
      name: 'Nilgiri View County',
      location: 'Pollachi, Tamil Nadu',
      address: 'Near Anaimalai Hills Road, Pollachi 642001',
      description: 'Premium gated agricultural estate community with 360-degree mountain views, blacktop roads, and 24/7 security.',
    },
    {
      name: 'Emerald Meadows',
      location: 'Coimbatore, Tamil Nadu',
      address: 'Kovaipudur Extension, Coimbatore 641042',
      description: 'DTCP & RERA approved residential villa plots with clubhouse, solar streetlights, and landscaped gardens.',
    },
    {
      name: 'Green Valley Agrofarms',
      location: 'Erode, Tamil Nadu',
      address: 'Perundurai Bypass, Erode 638052',
      description: 'Fertile managed farmland plots with drip irrigation, fruit orchards, and farmhouse approvals.',
    },
    {
      name: 'Wayanad Highland Estates',
      location: 'Wayanad, Kerala',
      address: 'Vythiri Scenic Belt, Wayanad 673576',
      description: 'Eco-luxury coffee and spice plantation plots ideal for holiday homes and boutique retreats.',
    },
  ];

  const createdSites = [];
  for (const s of sitesData) {
    const site = await prisma.site.create({ data: s });
    createdSites.push(site);
  }
  console.log(`✅ Created ${createdSites.length} real estate project sites.`);

  // 5. Create Lead Sources (Exact handwritten reference sources!)
  const sourcesData = [
    { name: 'Whatsapp', description: 'WhatsApp Business Chat and click-to-chat campaigns' },
    { name: 'Facebook', description: 'Meta Facebook Feed Lead Ads and instant lead forms' },
    { name: 'Insta', description: 'Meta Instagram Reels, Stories, and Sponsored Video Ads' },
    { name: 'Direct', description: 'Direct customer inquiries and word-of-mouth referrals' },
    { name: 'Walk in', description: 'Walk-in visitors to branch offices and on-site sales lounges' },
    { name: 'Roadside', description: 'Highway billboards, roadside banners, posters, and local hoardings' },
    { name: 'Google Search Ads', description: 'High-intent search keyword campaigns for farmland & plots' },
    { name: 'Website Inquiry Portal', description: 'Organic inquiries via Kyra Group corporate website' },
  ];

  const createdSources = {};
  for (const src of sourcesData) {
    const item = await prisma.leadSource.create({ data: src });
    createdSources[src.name] = item;
  }
  console.log(`✅ Created ${Object.keys(createdSources).length} lead sources.`);

  // 6. Create Campaigns (by Digital Head)
  const campaignsData = [
    {
      name: 'Monsoon Farmland Harvest 2026',
      description: 'Targeting HNI investors for Green Valley Agrofarms and Nilgiri View County with guaranteed organic maintenance.',
      contentTitle: 'Own Your 1-Acre Organic Sanctuary in Pollachi',
      contentType: 'Video',
      platform: 'Meta',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-10-31'),
      status: 'Active',
      leadSourceId: createdSources['Facebook'].id,
      notes: 'Video walkthrough showing actual water yield and mountain backdrop.',
      createdById: createdUsers['digital@kyra.com'].id,
    },
    {
      name: 'Coimbatore Villa Plots Launch',
      description: 'Phase 2 launch campaign for Emerald Meadows Kovaipudur with bank loan tie-ups.',
      contentTitle: 'DTCP Approved Plots in Coimbatore from 25 Lakhs',
      contentType: 'Social media post',
      platform: 'Meta',
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-11-30'),
      status: 'Active',
      leadSourceId: createdSources['Insta'].id,
      notes: 'Promoting immediate construction readiness.',
      createdById: createdUsers['digital@kyra.com'].id,
    },
    {
      name: 'Wayanad Holiday Plantation Drive',
      description: 'Exclusive weekend getaway estate plots for high-income professionals in Kerala and Bengaluru.',
      contentTitle: 'Wayanad Highland Estates: Mist, Coffee & Solitude',
      contentType: 'Poster',
      platform: 'Print',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-15'),
      status: 'Active',
      leadSourceId: createdSources['Roadside'].id,
      notes: 'Full-page regional weekend feature.',
      createdById: createdUsers['digital@kyra.com'].id,
    },
  ];

  const createdCampaigns = [];
  for (const c of campaignsData) {
    const camp = await prisma.campaign.create({ data: c });
    createdCampaigns.push(camp);
  }
  console.log(`✅ Created ${createdCampaigns.length} campaigns.`);

  // 7. Create Customers & Leads matching reference sheet:
  // S.No (E01-E08), Cus Name, Profession, Phone, Time, Place, Site, Source, Follow up, Feedback
  const customersAndLeads = [
    {
      customer: {
        name: 'Arunachalam Sundaram',
        profession: 'Cardiologist & Clinic Director',
        phone: '+91 94432 18901',
        altPhone: '+91 94432 18902',
        email: 'arun.sundaram@gmail.com',
        location: 'Coimbatore, TN',
        address: '14/2 RS Puram, Coimbatore',
        preferredContact: 'Phone',
        notes: 'Looking for 2 acres of farmland near Pollachi with good water source.',
      },
      lead: {
        displayId: 'KYRA-LD-1001',
        enquiryNo: 'E01',
        siteId: createdSites[0].id, // Nilgiri View County
        leadSourceId: createdSources['Facebook'].id,
        campaignId: createdCampaigns[0].id,
        lifecycleStatus: 'SITE_VISIT_SCHEDULED',
        callFeedback: 'CONFIRM',
        priority: 'HIGH',
        preferredTime: '10:30 AM',
        metaPlatform: 'Facebook',
        metaCampaignName: 'Monsoon Farmland Harvest 2026',
        metaAdName: 'Pollachi Mountain View Video Ad',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller1@kyra.com'].id,
        assignedSiteId: createdUsers['site@kyra.com'].id,
        notes: 'Customer confirmed site visit inspection for this Saturday morning 10:30 AM.',
        lastContactedAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Answered',
        feedback: 'CONFIRM',
        notes: 'Detailed discussion about drip irrigation and fencing. Fixed site visit for upcoming Saturday 10:30 AM.',
        siteVisitFixed: true,
      },
      siteVisit: {
        displayId: 'KYRA-SV-2001',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        scheduledTime: '10:30 AM',
        status: 'CONFIRMED',
        visitRemarks: 'Client will arrive by own car with family. Site manager to arrange site vehicle for estate perimeter tour.',
      },
    },
    {
      customer: {
        name: 'Dr. Meera Nambiar',
        profession: 'Senior Gynecologist & Healthcare Director',
        phone: '+91 98470 54321',
        email: 'dr.meera.n@apollohospitals.org',
        location: 'Kochi, Kerala',
        address: 'B-402 Skyline Apartments, Panampilly Nagar, Kochi',
        preferredContact: 'WhatsApp',
        notes: 'Interested in eco-cottage plot in Wayanad for vacation home.',
      },
      lead: {
        displayId: 'KYRA-LD-1002',
        enquiryNo: 'E02',
        siteId: createdSites[3].id, // Wayanad
        leadSourceId: createdSources['Insta'].id,
        campaignId: createdCampaigns[1].id,
        lifecycleStatus: 'FOLLOW_UP_REQUIRED',
        callFeedback: 'CALL_BACK',
        priority: 'HIGH',
        preferredTime: '11:45 AM',
        metaPlatform: 'Insta',
        metaCampaignName: 'Coimbatore Villa Plots Launch',
        metaAdName: 'Wayanad Misty Hills Reel',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller1@kyra.com'].id,
        assignedSiteId: createdUsers['site@kyra.com'].id,
        notes: 'In surgery during initial contact. Requested callback tomorrow 11:45 AM.',
        lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextFollowUpAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Answered',
        feedback: 'CALL_BACK',
        notes: 'Dr. Meera was on clinic rounds. Requested call back tomorrow before noon.',
        siteVisitFixed: false,
        nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    },
    {
      customer: {
        name: 'Venkatesh Ramanathan',
        profession: 'Senior Software Architect',
        phone: '+91 97909 33211',
        location: 'Chennai, TN',
        address: 'Mylapore, Chennai',
        preferredContact: 'Phone',
        notes: 'Software architect looking for investment plot near Coimbatore.',
      },
      lead: {
        displayId: 'KYRA-LD-1003',
        enquiryNo: 'E03',
        siteId: createdSites[1].id, // Emerald Meadows
        leadSourceId: createdSources['Whatsapp'].id,
        campaignId: createdCampaigns[1].id,
        lifecycleStatus: 'CONTACTED',
        callFeedback: 'CALL_BUSY',
        priority: 'MEDIUM',
        preferredTime: '06:30 PM',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller2@kyra.com'].id,
        notes: 'Customer line was busy / in meetings during call. Scheduled retry for 6:30 PM today.',
        lastContactedAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Busy',
        feedback: 'CALL_BUSY',
        notes: 'Call waiting/busy. Sent WhatsApp greeting and scheduled callback.',
        nextFollowUpDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    },
    {
      customer: {
        name: 'Gopinath Balakrishnan',
        profession: 'Managing Director - Textile Mills',
        phone: '+91 94441 77890',
        location: 'Erode, TN',
        notes: 'Inquired about agricultural subsidies and borewell yield for agrofarm.',
      },
      lead: {
        displayId: 'KYRA-LD-1004',
        enquiryNo: 'E04',
        siteId: createdSites[2].id, // Green Valley
        leadSourceId: createdSources['Roadside'].id,
        campaignId: null,
        lifecycleStatus: 'SITE_VISIT_COMPLETED',
        callFeedback: 'CONFIRM',
        priority: 'HIGH',
        preferredTime: '02:00 PM',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller2@kyra.com'].id,
        assignedSiteId: createdUsers['site@kyra.com'].id,
        notes: 'Visited site yesterday with family. Impressed by soil quality and access road.',
        lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Answered',
        feedback: 'CONFIRM',
        notes: 'Fixed visit for Green Valley Agrofarms. Completed on schedule.',
        siteVisitFixed: true,
      },
      siteVisit: {
        displayId: 'KYRA-SV-2002',
        scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        scheduledTime: '11:00 AM',
        status: 'COMPLETED',
        visitRemarks: 'Client inspected plots 4B and 5A. Discussed pricing and registration schedule with Site Manager.',
        completionNotes: 'Client very satisfied. Forwarded legal title documents. Follow up on token advance.',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    },
    {
      customer: {
        name: 'Deepak Chandrasekhar',
        profession: 'Industrial Garment Exporter',
        phone: '+91 98840 99123',
        location: 'Tirupur, TN',
        notes: 'Garment manufacturing owner seeking 3 plots in gated community.',
      },
      lead: {
        displayId: 'KYRA-LD-1005',
        enquiryNo: 'E05',
        siteId: createdSites[1].id,
        leadSourceId: createdSources['Direct'].id,
        campaignId: null,
        lifecycleStatus: 'CONTACTED',
        callFeedback: 'SWITCHED_OFF',
        priority: 'MEDIUM',
        preferredTime: '03:15 PM',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller1@kyra.com'].id,
        notes: 'Phone switched off on first attempt. Retry scheduled for afternoon.',
        lastContactedAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Switched Off',
        feedback: 'SWITCHED_OFF',
        notes: 'Phone switched off. Dispatched brochure over WhatsApp.',
        nextFollowUpDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    },
    {
      customer: {
        name: 'Siddharth Varma',
        profession: 'Chartered Accountant & Tax Consultant',
        phone: '+91 99955 12044',
        location: 'Calicut, Kerala',
        notes: 'Looking for budget below unit baseline.',
      },
      lead: {
        displayId: 'KYRA-LD-1006',
        enquiryNo: 'E06',
        siteId: createdSites[3].id,
        leadSourceId: createdSources['Facebook'].id,
        campaignId: createdCampaigns[0].id,
        lifecycleStatus: 'CLOSED',
        callFeedback: 'NOT_INTERESTED',
        priority: 'LOW',
        preferredTime: '04:30 PM',
        metaPlatform: 'Facebook',
        metaCampaignName: 'Monsoon Farmland Harvest 2026',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller1@kyra.com'].id,
        notes: 'Budget was below minimum unit size. Marked not interested.',
        lastContactedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Answered',
        feedback: 'NOT_INTERESTED',
        notes: 'Customer looking for low-cost residential flats under 20L.',
        notInterestedReason: 'Budget mismatch',
      },
    },
    {
      customer: {
        name: 'Harish Kumar',
        profession: 'Civil Infrastructure Contractor',
        phone: '+91 98422 66778',
        location: 'Pollachi, TN',
      },
      lead: {
        displayId: 'KYRA-LD-1007',
        enquiryNo: 'E07',
        siteId: createdSites[0].id,
        leadSourceId: createdSources['Walk in'].id,
        lifecycleStatus: 'CONTACTED',
        callFeedback: 'NOT_CONNECTED',
        priority: 'MEDIUM',
        preferredTime: '10:00 AM',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller2@kyra.com'].id,
        notes: 'Ringing unanswered. Follow up scheduled for tomorrow morning.',
        lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextFollowUpAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Ringing Unanswered',
        feedback: 'NOT_CONNECTED',
        notes: 'Ringing unanswered. Set retry for tomorrow morning.',
        nextFollowUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    },
    {
      customer: {
        name: 'Rajeshwari Krishnan',
        profession: 'NRI Real Estate Investor',
        phone: '+91 98944 55122',
        location: 'Coimbatore, TN',
        notes: 'NRI buyer residing in Singapore, evaluating farmland parcels in Pollachi.',
      },
      lead: {
        displayId: 'KYRA-LD-1008',
        enquiryNo: 'E08',
        siteId: createdSites[0].id,
        leadSourceId: createdSources['Insta'].id,
        lifecycleStatus: 'IN_PROGRESS',
        callFeedback: 'OTHERS',
        priority: 'HIGH',
        preferredTime: '12:00 PM',
        metaPlatform: 'Insta',
        metaCampaignName: 'Coimbatore Villa Plots Launch',
        assignedCrmId: createdUsers['crm@kyra.com'].id,
        assignedTelecallerId: createdUsers['telecaller2@kyra.com'].id,
        notes: 'Requested WhatsApp video call with site manager on Sunday.',
        lastContactedAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      hasCall: true,
      callData: {
        outcome: 'Answered',
        feedback: 'OTHERS',
        notes: 'Client requested virtual walkthrough video on WhatsApp.',
      },
    },
  ];

  for (const item of customersAndLeads) {
    const cust = await prisma.customer.create({ data: item.customer });
    const lead = await prisma.lead.create({
      data: {
        ...item.lead,
        customerId: cust.id,
        createdById: createdUsers['crm@kyra.com'].id,
      },
    });

    if (lead.assignedTelecallerId) {
      await prisma.leadAssignmentHistory.create({
        data: {
          leadId: lead.id,
          toUserId: lead.assignedTelecallerId,
          assignedById: createdUsers['crm@kyra.com'].id,
          notes: 'Initial assignment by CRM Executive.',
        },
      });
    }

    if (item.hasCall) {
      await prisma.callReport.create({
        data: {
          leadId: lead.id,
          telecallerId: lead.assignedTelecallerId || createdUsers['telecaller1@kyra.com'].id,
          calledAt: lead.lastContactedAt || new Date(),
          ...item.callData,
        },
      });
    }

    if (item.siteVisit) {
      await prisma.siteVisit.create({
        data: {
          ...item.siteVisit,
          leadId: lead.id,
          customerId: cust.id,
          siteId: lead.siteId,
          assignedSiteManagerId: createdUsers['site@kyra.com'].id,
          createdById: lead.assignedTelecallerId || createdUsers['crm@kyra.com'].id,
        },
      });
    }
  }

  console.log('✅ Created initial Customers, Leads, Call Reports, and Site Visits.');

  // 8. Create Tasks
  const tasksData = [
    {
      displayId: 'KYRA-TSK-3001',
      title: 'Verify Pollachi Phase-2 Title Documents with Legal Council',
      description: 'Collect surveyed boundary drawings and certified encumbrance certificate (EC) for Nilgiri View County.',
      assignedToId: createdUsers['site@kyra.com'].id,
      createdById: createdUsers['gm@kyra.com'].id,
      category: 'Administrative',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
    },
    {
      displayId: 'KYRA-TSK-3002',
      title: 'Upload Wayanad Monsoon Drone Footage to Social Ad Campaign',
      description: 'Prepare 30s cut and 15s Instagram reel showing misty coffee plantation plots.',
      assignedToId: createdUsers['digital@kyra.com'].id,
      createdById: createdUsers['gm@kyra.com'].id,
      category: 'Promotional Content',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'TODO',
    },
    {
      displayId: 'KYRA-TSK-3003',
      title: 'Prepare Weekend Site Visit Transport & Welcome Kit for Dr. Meera & Arunachalam',
      description: 'Ensure battery-operated golf cart / site 4WD is refueled and project masterplans are printed.',
      assignedToId: createdUsers['site@kyra.com'].id,
      createdById: createdUsers['crm@kyra.com'].id,
      category: 'Site Visit Coordination',
      priority: 'URGENT',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'TODO',
    },
    {
      displayId: 'KYRA-TSK-3004',
      title: 'Call Back Pending Web Inquiries from Coimbatore Expo',
      description: 'Follow up with 15 leads generated at the property exhibition.',
      assignedToId: createdUsers['telecaller1@kyra.com'].id,
      createdById: createdUsers['crm@kyra.com'].id,
      category: 'Lead Followup',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
    },
  ];

  for (const t of tasksData) {
    await prisma.task.create({ data: t });
  }
  console.log(`✅ Created ${tasksData.length} tasks.`);

  // 9. Create Notifications
  const notificationsData = [
    {
      userId: createdUsers['telecaller1@kyra.com'].id,
      type: 'LEAD_ASSIGNED',
      title: 'New High-Priority Lead Assigned',
      message: 'Lead E01 (Arunachalam Sundaram) assigned to you for Nilgiri View County.',
      linkUrl: '/leads/KYRA-LD-1001',
    },
    {
      userId: createdUsers['site@kyra.com'].id,
      type: 'SITE_VISIT_SCHEDULED',
      title: 'Site Visit Scheduled for Pollachi',
      message: 'Client Arunachalam Sundaram scheduled for Saturday 10:30 AM at Nilgiri View County.',
      linkUrl: '/site-visits',
    },
    {
      userId: createdUsers['telecaller2@kyra.com'].id,
      type: 'FOLLOW_UP_DUE',
      title: 'Follow-Up Due Today',
      message: 'Customer Venkatesh Ramanathan requested call back at 6:30 PM.',
      linkUrl: '/leads/KYRA-LD-1003',
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✅ Created ${notificationsData.length} notifications.`);

  // 10. Meta Integration Config & Sample Ingestion Logs
  await prisma.metaIntegrationConfig.create({
    data: {
      id: 'default',
      isEnabled: true,
      webhookUrl: '/api/integrations/meta',
      verifyToken: 'kyra_meta_leads_webhook_token_2026',
      adAccountId: 'act_849201948201',
      pageAccessToken: 'EAAB...kyra_meta_access_token_production',
      autoAssignRole: 'TELECALLER',
      lastSyncAt: new Date(),
    },
  });

  const metaLogs = [
    {
      metaLeadId: 'meta_lead_98124',
      platform: 'Facebook',
      campaignName: 'Monsoon Farmland Harvest 2026',
      adName: 'Pollachi Mountain View Video Ad',
      customerName: 'Arunachalam Sundaram',
      phone: '+91 94432 18901',
      place: 'Coimbatore',
      profession: 'Cardiologist & Clinic Director',
      status: 'SUCCESS',
      assignedToId: 'Priya Nair',
      leadId: 'KYRA-LD-1001',
      rawPayload: JSON.stringify({ source: 'facebook_leadgen', ad_id: 'ad_992' }),
    },
    {
      metaLeadId: 'meta_lead_98125',
      platform: 'Insta',
      campaignName: 'Coimbatore Villa Plots Launch',
      adName: 'Wayanad Misty Hills Reel',
      customerName: 'Dr. Meera Nambiar',
      phone: '+91 98470 54321',
      place: 'Kochi',
      profession: 'Senior Gynecologist & Healthcare Director',
      status: 'SUCCESS',
      assignedToId: 'Priya Nair',
      leadId: 'KYRA-LD-1002',
      rawPayload: JSON.stringify({ source: 'instagram_reels_leadgen' }),
    },
    {
      metaLeadId: 'meta_lead_98126',
      platform: 'Insta',
      campaignName: 'Coimbatore Villa Plots Launch',
      adName: 'Emerald Meadows Story',
      customerName: 'Rajeshwari Krishnan',
      phone: '+91 98944 55122',
      place: 'Coimbatore',
      profession: 'NRI Real Estate Investor',
      status: 'SUCCESS',
      assignedToId: 'Rahul Krishnan',
      leadId: 'KYRA-LD-1008',
      rawPayload: JSON.stringify({ source: 'instagram_story_leadgen' }),
    },
  ];

  for (const m of metaLogs) {
    await prisma.metaLeadLog.create({ data: m });
  }
  console.log(`✅ Seeded Meta Ad Manager integration config and ${metaLogs.length} activity logs.`);

  // 11. Audit Log Initial Entry
  await prisma.auditLog.create({
    data: {
      userId: createdUsers['gm@kyra.com'].id,
      action: 'LOGIN',
      entityType: 'AUTH',
      entityId: createdUsers['gm@kyra.com'].id,
      details: JSON.stringify({ note: 'Initial system bootstrap and database setup.' }),
      ipAddress: '127.0.0.1',
    },
  });

  console.log('\n🚀 Database seeding completed successfully!');
  console.log('\n🔑 10 Employee Accounts Ready (Password: Password123!):');
  console.log('1. General Manager:     gm@kyra.com');
  console.log('2. Digital Head:         digital@kyra.com');
  console.log('3. CRM Executive:        crm@kyra.com');
  console.log('4. Site Manager (Pollachi): site@kyra.com');
  console.log('5. Site Manager (Coimbatore): site2@kyra.com');
  console.log('6. Telecaller 1:         telecaller1@kyra.com');
  console.log('7. Telecaller 2:         telecaller2@kyra.com');
  console.log('8. Telecaller 3:         telecaller3@kyra.com');
  console.log('9. Telecaller 4:         telecaller4@kyra.com');
  console.log('10. Telecaller 5:        telecaller5@kyra.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
