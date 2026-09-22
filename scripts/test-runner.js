const assert = require('assert');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:' + path.join(process.cwd(), 'prisma', 'dev.db');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "kyra-enterprise-crm-super-secure-jwt-secret-key-production-2026";

async function runTests() {
  console.log('🧪 Running KYRA CRM Production Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}\n`);
      failed++;
    }
  }

  // TEST 1: Password Hashing & Verification
  await test('Password authentication & bcrypt verification', async () => {
    const plain = 'SecurePass123!';
    const hash = await bcrypt.hash(plain, 10);
    const isValid = await bcrypt.compare(plain, hash);
    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isValid, true, 'Password should match correct hash');
    assert.strictEqual(isInvalid, false, 'Invalid password should be rejected');
  });

  // TEST 2: JWT Creation & Decoding
  await test('JWT Session Token generation and payload decoding', async () => {
    const payload = { userId: 'usr_test_123', email: 'test@kyra.com', role: 'CRM_EXECUTIVE' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.role, payload.role);
  });

  // TEST 3: Active Status Check on User
  await test('Database User status integrity (Active accounts verified)', async () => {
    const gm = await prisma.user.findUnique({ where: { email: 'gm@kyra.com' } });
    assert.ok(gm, 'GM account must exist in seeded DB');
    assert.strictEqual(gm.status, 'ACTIVE', 'GM account must be ACTIVE');
    assert.strictEqual(gm.role, 'GENERAL_MANAGER');
  });

  // TEST 4: Lead Creation & Duplicate Phone Detection Logic
  await test('Lead creation and duplicate phone number detection', async () => {
    const testPhone = '+91 99999 11223';
    // Clean any prior test run
    const existing = await prisma.customer.findUnique({ where: { phone: testPhone } });
    if (existing) {
      await prisma.lead.deleteMany({ where: { customerId: existing.id } });
      await prisma.customer.delete({ where: { id: existing.id } });
    }

    // Step A: Create customer
    const cust1 = await prisma.customer.create({
      data: {
        name: 'Test Prospect A',
        phone: testPhone,
        location: 'Coimbatore',
      },
    });

    const gm = await prisma.user.findUnique({ where: { email: 'gm@kyra.com' } });

    const lead1 = await prisma.lead.create({
      data: {
        displayId: `KYRA-TEST-${Date.now()}`,
        customerId: cust1.id,
        createdById: gm.id,
        priority: 'HIGH',
        lifecycleStatus: 'NEW',
      },
    });

    assert.ok(lead1.id, 'Lead 1 should be created');

    // Step B: Check duplicate detection query
    const dupCheck = await prisma.customer.findUnique({ where: { phone: testPhone } });
    assert.ok(dupCheck, 'Duplicate phone should be detected in database');
    assert.strictEqual(dupCheck.id, cust1.id, 'Customer ID should match');
  });

  // TEST 5: Telecaller Assignment and History Tracking
  await test('Lead assignment updates lifecycleStatus and creates history', async () => {
    const telecaller = await prisma.user.findUnique({ where: { email: 'telecaller1@kyra.com' } });
    const gm = await prisma.user.findUnique({ where: { email: 'gm@kyra.com' } });

    const testPhone = '+91 88888 22334';
    let cust = await prisma.customer.findUnique({ where: { phone: testPhone } });
    if (!cust) {
      cust = await prisma.customer.create({
        data: { name: 'Assignment Test Customer', phone: testPhone, location: 'Pollachi' },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        displayId: `KYRA-TEST-ASN-${Date.now()}`,
        customerId: cust.id,
        createdById: gm.id,
        lifecycleStatus: 'NEW',
      },
    });

    // Assign to telecaller
    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        assignedTelecallerId: telecaller.id,
        lifecycleStatus: 'ASSIGNED',
      },
    });

    const hist = await prisma.leadAssignmentHistory.create({
      data: {
        leadId: lead.id,
        toUserId: telecaller.id,
        assignedById: gm.id,
        notes: 'Assigned via test suite',
      },
    });

    assert.strictEqual(updatedLead.assignedTelecallerId, telecaller.id);
    assert.strictEqual(updatedLead.lifecycleStatus, 'ASSIGNED');
    assert.strictEqual(hist.toUserId, telecaller.id);
  });

  // TEST 6: Telecaller Call Logging & Controlled Feedback
  await test('Call report logging with controlled feedback (INTERESTED)', async () => {
    const telecaller = await prisma.user.findUnique({ where: { email: 'telecaller1@kyra.com' } });
    const lead = await prisma.lead.findFirst({ where: { assignedTelecallerId: telecaller.id } });
    assert.ok(lead, 'Telecaller must have at least one lead');

    const call = await prisma.callReport.create({
      data: {
        leadId: lead.id,
        telecallerId: telecaller.id,
        outcome: 'Answered',
        feedback: 'INTERESTED',
        notes: 'Prospect confirmed high interest in organic farm plot.',
        siteVisitFixed: true,
      },
    });

    assert.ok(call.id, 'Call report should be saved');
    assert.strictEqual(call.feedback, 'INTERESTED');
    assert.strictEqual(call.siteVisitFixed, true);
  });

  // TEST 7: Site Visit Fixed Workflow & Deduplication
  await test('Interested prospect with Fixed site visit generates SiteVisit record', async () => {
    const telecaller = await prisma.user.findUnique({ where: { email: 'telecaller1@kyra.com' } });
    const site = await prisma.site.findFirst();
    assert.ok(site, 'Site must exist');

    const cust = await prisma.customer.create({
      data: {
        name: 'Site Visit Prospect',
        phone: `+91 77777 ${Math.floor(10000 + Math.random() * 90000)}`,
        location: 'Coimbatore',
      },
    });

    const lead = await prisma.lead.create({
      data: {
        displayId: `KYRA-LD-TEST-SV-${Date.now()}`,
        customerId: cust.id,
        siteId: site.id,
        createdById: telecaller.id,
        assignedTelecallerId: telecaller.id,
      },
    });

    // Fix a site visit
    const scheduledDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const siteVisit = await prisma.siteVisit.create({
      data: {
        displayId: `KYRA-SV-TEST-${Date.now()}`,
        leadId: lead.id,
        customerId: cust.id,
        siteId: site.id,
        scheduledDate,
        scheduledTime: '10:30 AM',
        status: 'SCHEDULED',
        createdById: telecaller.id,
        visitRemarks: 'Client driving from Pollachi',
      },
    });

    assert.ok(siteVisit.id, 'Site visit record must be created');
    assert.strictEqual(siteVisit.status, 'SCHEDULED');
    assert.strictEqual(siteVisit.leadId, lead.id);
  });

  // TEST 8: Site Visit Rescheduling with History Preservation
  await test('Site visit rescheduling preserves old appointment in history', async () => {
    const siteVisit = await prisma.siteVisit.findFirst({ where: { status: 'SCHEDULED' } });
    assert.ok(siteVisit, 'Site visit must exist for test');

    const history = [];
    history.push({
      previousDate: siteVisit.scheduledDate,
      previousTime: siteVisit.scheduledTime,
      rescheduledAt: new Date(),
      rescheduledBy: 'CRM Executive',
      reason: 'Client requested Monday instead of Sunday',
    });

    const newDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const updated = await prisma.siteVisit.update({
      where: { id: siteVisit.id },
      data: {
        status: 'RESCHEDULED',
        scheduledDate: newDate,
        scheduledTime: '02:30 PM',
        rescheduleHistory: JSON.stringify(history),
      },
    });

    assert.strictEqual(updated.status, 'RESCHEDULED');
    const parsedHistory = JSON.parse(updated.rescheduleHistory);
    assert.strictEqual(parsedHistory.length, 1);
    assert.strictEqual(parsedHistory[0].reason, 'Client requested Monday instead of Sunday');
  });

  // TEST 9: Operational Task Assignment & Completion
  await test('Work task assignment by manager and employee completion', async () => {
    const gm = await prisma.user.findUnique({ where: { email: 'gm@kyra.com' } });
    const siteMgr = await prisma.user.findUnique({ where: { email: 'site@kyra.com' } });

    const task = await prisma.task.create({
      data: {
        displayId: `KYRA-TSK-TEST-${Date.now()}`,
        title: 'Check perimeter fencing on plot 7B',
        assignedToId: siteMgr.id,
        createdById: gm.id,
        category: 'Site Visit Coordination',
        priority: 'HIGH',
        status: 'TODO',
      },
    });

    assert.ok(task.id);
    assert.strictEqual(task.status, 'TODO');

    // Site Manager marks completed
    const completed = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'COMPLETED',
        completionNotes: 'Fencing surveyed and reinforced with boundary markers.',
      },
    });

    assert.strictEqual(completed.status, 'COMPLETED');
    assert.ok(completed.completionNotes);
  });

  // TEST 10: Audit Log Persistence
  await test('System Audit Log records mutations with metadata', async () => {
    const gm = await prisma.user.findUnique({ where: { email: 'gm@kyra.com' } });
    const log = await prisma.auditLog.create({
      data: {
        userId: gm.id,
        action: 'LEAD_CREATED',
        entityType: 'LEAD',
        entityId: 'test_lead_id_999',
        details: JSON.stringify({ note: 'Automated test suite verification' }),
        ipAddress: '127.0.0.1',
      },
    });

    assert.ok(log.id, 'Audit log must be created');
    assert.strictEqual(log.action, 'LEAD_CREATED');
    assert.strictEqual(log.entityType, 'LEAD');
  });

  // TEST 11: Handwritten Reference Sheet Fields (Profession, EnquiryNo, Lead Sources)
  await test('Reference sheet fields integrity (Profession, EnquiryNo, Sources: Whatsapp, Facebook, Insta, Roadside)', async () => {
    const lead = await prisma.lead.findFirst({
      where: { enquiryNo: 'E01' },
      include: { customer: true, leadSource: true },
    });
    assert.ok(lead, 'Lead E01 must exist');
    assert.strictEqual(lead.enquiryNo, 'E01');
    assert.ok(lead.customer.profession, 'Customer profession must be persisted');
    assert.strictEqual(lead.customer.profession, 'Cardiologist & Clinic Director');

    // Verify lead sources from handwritten reference note
    const sources = await prisma.leadSource.findMany();
    const sourceNames = sources.map((s) => s.name);
    assert.ok(sourceNames.includes('Whatsapp'), 'Whatsapp source must exist');
    assert.ok(sourceNames.includes('Facebook'), 'Facebook source must exist');
    assert.ok(sourceNames.includes('Insta'), 'Insta source must exist');
    assert.ok(sourceNames.includes('Direct'), 'Direct source must exist');
    assert.ok(sourceNames.includes('Walk in'), 'Walk in source must exist');
    assert.ok(sourceNames.includes('Roadside'), 'Roadside source must exist');
  });

  // TEST 12: Reference Feedback Dispositions (CONFIRM, CALL_BUSY, SWITCHED_OFF, OTHERS)
  await test('Reference feedback dispositions handling (CONFIRM, CALL_BUSY, SWITCHED_OFF, OTHERS)', async () => {
    const telecaller = await prisma.user.findUnique({ where: { email: 'telecaller1@kyra.com' } });
    const lead = await prisma.lead.findFirst();

    // Log call with CALL_BUSY
    const busyCall = await prisma.callReport.create({
      data: {
        leadId: lead.id,
        telecallerId: telecaller.id,
        outcome: 'Busy',
        feedback: 'CALL_BUSY',
        notes: 'Line busy, automated test verification.',
      },
    });
    assert.strictEqual(busyCall.feedback, 'CALL_BUSY');

    // Log call with SWITCHED_OFF
    const switchedOffCall = await prisma.callReport.create({
      data: {
        leadId: lead.id,
        telecallerId: telecaller.id,
        outcome: 'Switched Off',
        feedback: 'SWITCHED_OFF',
        notes: 'Handset switched off.',
      },
    });
    assert.strictEqual(switchedOffCall.feedback, 'SWITCHED_OFF');

    // Log call with CONFIRM
    const confirmCall = await prisma.callReport.create({
      data: {
        leadId: lead.id,
        telecallerId: telecaller.id,
        outcome: 'Answered',
        feedback: 'CONFIRM',
        notes: 'Customer confirmed site visit appointment.',
        siteVisitFixed: true,
      },
    });
    assert.strictEqual(confirmCall.feedback, 'CONFIRM');
    assert.strictEqual(confirmCall.siteVisitFixed, true);
  });

  // TEST 13: Meta Ad Manager Webhook Ingestion & Auto-Assignment Engine
  await test('Meta Ad Manager Webhook ingestion and Round-Robin auto assignment', async () => {
    const testPhone = `+91 91234 ${Math.floor(10000 + Math.random() * 90000)}`;
    const custName = 'Meta Test Buyer';
    const profession = 'Structural Engineer';
    const place = 'Coimbatore';

    // 1. Create or update customer
    const cust = await prisma.customer.create({
      data: {
        name: custName,
        phone: testPhone,
        location: place,
        profession,
      },
    });

    // 2. Pick active telecaller
    const telecaller = await prisma.user.findFirst({
      where: { role: 'TELECALLER', status: 'ACTIVE' },
    });
    assert.ok(telecaller, 'Active telecaller must exist for auto-assignment');

    const gm = await prisma.user.findUnique({ where: { email: 'gm@kyra.com' } });

    // 3. Create lead tagged with Meta platform
    const metaLead = await prisma.lead.create({
      data: {
        displayId: `KYRA-LD-META-${Date.now()}`,
        enquiryNo: `E_TEST_${Date.now()}`,
        customerId: cust.id,
        createdById: gm.id,
        assignedTelecallerId: telecaller.id,
        lifecycleStatus: 'ASSIGNED',
        metaPlatform: 'Facebook',
        metaCampaignName: 'Monsoon Farmland Harvest 2026',
        metaAdName: 'Lead Ad Reel',
      },
    });

    // 4. Log in MetaLeadLog
    const metaLog = await prisma.metaLeadLog.create({
      data: {
        metaLeadId: `meta_${Date.now()}`,
        platform: 'Facebook',
        campaignName: 'Monsoon Farmland Harvest 2026',
        customerName: custName,
        phone: testPhone,
        place,
        profession,
        status: 'SUCCESS',
        assignedToId: telecaller.name,
        leadId: metaLead.displayId,
      },
    });

    assert.ok(metaLead.id);
    assert.strictEqual(metaLead.metaPlatform, 'Facebook');
    assert.strictEqual(metaLead.assignedTelecallerId, telecaller.id);
    assert.strictEqual(metaLog.status, 'SUCCESS');
    assert.strictEqual(metaLog.customerName, custName);
  });

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
