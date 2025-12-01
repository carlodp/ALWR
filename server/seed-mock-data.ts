import { db } from "./db";
import { users, customers, subscriptions, documents, customerNotes, agents, resellers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { fileURLToPath } from "url";
import { dirname } from "path";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedMockData() {
  // Skip seeding if database is not available (using in-memory storage)
  if (!db) {
    console.log("⏭️  Skipping mock data seeding (using in-memory storage)");
    return;
  }

  console.log("🌱 Seeding mock admin users...");

  try {
    // Create only the super_admin user (carlo@wdmorgan.com)
    const adminUsers = [
      { email: "carlo@wdmorgan.com", firstName: "Carlo", lastName: "Morgan", password: "Carlo123!", role: "super_admin" },
    ];

    for (const adminUser of adminUsers) {
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, adminUser.email),
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        const [newUser] = await db
          .insert(users)
          .values({
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            password: hashedPassword,
            role: adminUser.role,
          })
          .returning();
        console.log(`✅ Created ${adminUser.role}: ${adminUser.email} (password: ${adminUser.password})`);
      } else {
        console.log(`✅ Admin user already exists: ${adminUser.email}`);
      }
    }

    console.log("\n🌱 Seeding mock customer data...");

    // Create mock users and customers - expanded to 35+ customers with all new fields
    const mockCustomers = [
      // Original 5 + enhanced with new fields
      { email: "john.smith@example.com", firstName: "John", lastName: "Smith", prnNumber: "10001", title: "Mr.", organization: "Smith Healthcare", phone1: "(555) 123-4567", phone1Ext: "ext", address1: "123 Main Street", address2: "Suite 100", city: "New York", state: "NY", zipCode: "10001", country: "United States", emergencyContactName: "Mary Smith", emergencyContactPhone: "(555) 123-4568", emergencyContactRelationship: "Spouse" },
      { email: "sarah.johnson@example.com", firstName: "Sarah", lastName: "Johnson", prnNumber: "10002", title: "Dr.", organization: "Johnson Medical", phone1: "(555) 234-5678", phone1Ext: "", address1: "456 Oak Avenue", address2: "", city: "Los Angeles", state: "CA", zipCode: "90001", country: "United States", emergencyContactName: "David Johnson", emergencyContactPhone: "(555) 234-5679", emergencyContactRelationship: "Son" },
      { email: "michael.brown@example.com", firstName: "Michael", lastName: "Brown", prnNumber: "10003", title: "Mr.", organization: "Brown Industries", phone1: "(555) 345-6789", phone1Ext: "101", address1: "789 Pine Road", address2: "Building A", city: "Chicago", state: "IL", zipCode: "60601", country: "United States", emergencyContactName: "Jennifer Brown", emergencyContactPhone: "(555) 345-6790", emergencyContactRelationship: "Daughter" },
      { email: "elizabeth.davis@example.com", firstName: "Elizabeth", lastName: "Davis", prnNumber: "10004", title: "Mrs.", organization: "Davis Consulting", phone1: "(555) 456-7890", phone1Ext: "", address1: "321 Elm Street", address2: "Apt 201", city: "Houston", state: "TX", zipCode: "77001", country: "United States", emergencyContactName: "Robert Davis", emergencyContactPhone: "(555) 456-7891", emergencyContactRelationship: "Brother" },
      { email: "william.miller@example.com", firstName: "William", lastName: "Miller", prnNumber: "10005", title: "Mr.", organization: "Miller Law", phone1: "(555) 567-8901", phone1Ext: "200", address1: "654 Maple Drive", address2: "", city: "Phoenix", state: "AZ", zipCode: "85001", country: "United States", emergencyContactName: "Linda Miller", emergencyContactPhone: "(555) 567-8902", emergencyContactRelationship: "Sister" },
      
      { email: "james.wilson@example.com", firstName: "James", lastName: "Wilson", prnNumber: "10006", title: "Rev.", organization: "Wilson Ministry", phone1: "(555) 678-9012", phone1Ext: "", address1: "987 Cedar Lane", address2: "", city: "Philadelphia", state: "PA", zipCode: "19101", country: "United States", emergencyContactName: "Patricia Wilson", emergencyContactPhone: "(555) 678-9013", emergencyContactRelationship: "Spouse" },
      { email: "maria.garcia@example.com", firstName: "Maria", lastName: "Garcia", prnNumber: "10007", title: "Ms.", organization: "Garcia Dental", phone1: "(555) 789-0123", phone1Ext: "ext", address1: "135 Birch Street", address2: "Ste 300", city: "San Antonio", state: "TX", zipCode: "78201", country: "United States", emergencyContactName: "Carlos Garcia", emergencyContactPhone: "(555) 789-0124", emergencyContactRelationship: "Son" },
      { email: "robert.martinez@example.com", firstName: "Robert", lastName: "Martinez", prnNumber: "10008", title: "Mr.", organization: "Martinez LLC", phone1: "(555) 890-1234", phone1Ext: "", address1: "246 Spruce Road", address2: "", city: "San Diego", state: "CA", zipCode: "92101", country: "United States", emergencyContactName: "Angela Martinez", emergencyContactPhone: "(555) 890-1235", emergencyContactRelationship: "Daughter" },
      { email: "linda.anderson@example.com", firstName: "Linda", lastName: "Anderson", prnNumber: "10009", title: "Ms.", organization: "Anderson Corp", phone1: "(555) 901-2345", phone1Ext: "102", address1: "357 Willow Drive", address2: "Office 5", city: "Dallas", state: "TX", zipCode: "75201", country: "United States", emergencyContactName: "Thomas Anderson", emergencyContactPhone: "(555) 901-2346", emergencyContactRelationship: "Brother" },
      { email: "charles.taylor@example.com", firstName: "Charles", lastName: "Taylor", prnNumber: "10010", title: "Mr.", organization: "Taylor Group", phone1: "(555) 012-3456", phone1Ext: "ext", address1: "468 Ash Avenue", address2: "", city: "Austin", state: "TX", zipCode: "78701", country: "United States", emergencyContactName: "Margaret Taylor", emergencyContactPhone: "(555) 012-3457", emergencyContactRelationship: "Sister" },
      
      { email: "patricia.thomas@example.com", firstName: "Patricia", lastName: "Thomas", prnNumber: "10011", title: "Mrs.", organization: "Thomas Inc", phone1: "(555) 123-5678", phone1Ext: "", address1: "579 Hickory Lane", address2: "Ste 10", city: "Jacksonville", state: "FL", zipCode: "32099", country: "United States", emergencyContactName: "Richard Thomas", emergencyContactPhone: "(555) 123-5679", emergencyContactRelationship: "Spouse" },
      { email: "richard.jackson@example.com", firstName: "Richard", lastName: "Jackson", prnNumber: "10012", title: "Mr.", organization: "Jackson Ventures", phone1: "(555) 234-6789", phone1Ext: "150", address1: "680 Sycamore Street", address2: "", city: "Memphis", state: "TN", zipCode: "37501", country: "United States", emergencyContactName: "Susan Jackson", emergencyContactPhone: "(555) 234-6790", emergencyContactRelationship: "Daughter" },
      { email: "susan.white@example.com", firstName: "Susan", lastName: "White", prnNumber: "10013", title: "Dr.", organization: "White Clinic", phone1: "(555) 345-7890", phone1Ext: "", address1: "791 Cottonwood Road", address2: "Unit 9", city: "Baltimore", state: "MD", zipCode: "21202", country: "United States", emergencyContactName: "Michael White", emergencyContactPhone: "(555) 345-7891", emergencyContactRelationship: "Son" },
      { email: "thomas.harris@example.com", firstName: "Thomas", lastName: "Harris", prnNumber: "10014", title: "Mr.", organization: "Harris Partners", phone1: "(555) 456-8901", phone1Ext: "203", address1: "802 Dogwood Drive", address2: "", city: "Boston", state: "MA", zipCode: "02101", country: "United States", emergencyContactName: "Nancy Harris", emergencyContactPhone: "(555) 456-8902", emergencyContactRelationship: "Spouse" },
      { email: "margaret.martin@example.com", firstName: "Margaret", lastName: "Martin", prnNumber: "10015", title: "Ms.", organization: "Martin Agency", phone1: "(555) 567-9012", phone1Ext: "", address1: "913 Redbud Avenue", address2: "Apt 320", city: "Seattle", state: "WA", zipCode: "98101", country: "United States", emergencyContactName: "Steven Martin", emergencyContactPhone: "(555) 567-9013", emergencyContactRelationship: "Brother" },
      
      { email: "steven.perez@example.com", firstName: "Steven", lastName: "Perez", prnNumber: "10016", title: "Mr.", organization: "Perez Holdings", phone1: "(555) 678-0123", phone1Ext: "ext", address1: "024 Chestnut Lane", address2: "", city: "Denver", state: "CO", zipCode: "80202", country: "United States", emergencyContactName: "Diana Perez", emergencyContactPhone: "(555) 678-0124", emergencyContactRelationship: "Sister" },
      { email: "nancy.robinson@example.com", firstName: "Nancy", lastName: "Robinson", prnNumber: "10017", title: "Mrs.", organization: "Robinson Estate", phone1: "(555) 789-1234", phone1Ext: "100", address1: "135 Magnolia Drive", address2: "Ste 2", city: "Miami", state: "FL", zipCode: "33101", country: "United States", emergencyContactName: "Frank Robinson", emergencyContactPhone: "(555) 789-1235", emergencyContactRelationship: "Spouse" },
      { email: "frank.walker@example.com", firstName: "Frank", lastName: "Walker", prnNumber: "10018", title: "Mr.", organization: "Walker Trade", phone1: "(555) 890-2345", phone1Ext: "", address1: "246 Laurel Street", address2: "", city: "Portland", state: "OR", zipCode: "97201", country: "United States", emergencyContactName: "Judith Walker", emergencyContactPhone: "(555) 890-2346", emergencyContactRelationship: "Daughter" },
      { email: "judith.young@example.com", firstName: "Judith", lastName: "Young", prnNumber: "10019", title: "Ms.", organization: "Young Media", phone1: "(555) 901-3456", phone1Ext: "205", address1: "357 Juniper Road", address2: "Unit 15", city: "Las Vegas", state: "NV", zipCode: "89101", country: "United States", emergencyContactName: "Edward Young", emergencyContactPhone: "(555) 901-3457", emergencyContactRelationship: "Son" },
      { email: "edward.king@example.com", firstName: "Edward", lastName: "King", prnNumber: "10020", title: "Mr.", organization: "King Enterprises", phone1: "(555) 012-4567", phone1Ext: "ext", address1: "468 Poplar Avenue", address2: "", city: "New Orleans", state: "LA", zipCode: "70112", country: "United States", emergencyContactName: "Dorothy King", emergencyContactPhone: "(555) 012-4568", emergencyContactRelationship: "Spouse" },
      
      { email: "dorothy.wright@example.com", firstName: "Dorothy", lastName: "Wright", prnNumber: "10021", title: "Mrs.", organization: "Wright & Co", phone1: "(555) 123-6789", phone1Ext: "", address1: "579 Tulip Lane", address2: "Apt 401", city: "Fresno", state: "CA", zipCode: "93650", country: "United States", emergencyContactName: "Ralph Wright", emergencyContactPhone: "(555) 123-6790", emergencyContactRelationship: "Brother" },
      { email: "ralph.lopez@example.com", firstName: "Ralph", lastName: "Lopez", prnNumber: "10022", title: "Mr.", organization: "Lopez Solutions", phone1: "(555) 234-7890", phone1Ext: "150", address1: "680 Orchid Street", address2: "", city: "Sacramento", state: "CA", zipCode: "95814", country: "United States", emergencyContactName: "Betty Lopez", emergencyContactPhone: "(555) 234-7891", emergencyContactRelationship: "Sister" },
      { email: "betty.lee@example.com", firstName: "Betty", lastName: "Lee", prnNumber: "10023", title: "Ms.", organization: "Lee Properties", phone1: "(555) 345-8901", phone1Ext: "", address1: "791 Iris Road", address2: "Ste 6", city: "Long Beach", state: "CA", zipCode: "90801", country: "United States", emergencyContactName: "George Lee", emergencyContactPhone: "(555) 345-8902", emergencyContactRelationship: "Spouse" },
      { email: "george.allen@example.com", firstName: "George", lastName: "Allen", prnNumber: "10024", title: "Mr.", organization: "Allen Systems", phone1: "(555) 456-9012", phone1Ext: "ext", address1: "802 Violet Avenue", address2: "", city: "Oakland", state: "CA", zipCode: "94601", country: "United States", emergencyContactName: "Helen Allen", emergencyContactPhone: "(555) 456-9013", emergencyContactRelationship: "Daughter" },
      { email: "helen.green@example.com", firstName: "Helen", lastName: "Green", prnNumber: "10025", title: "Mrs.", organization: "Green Wellness", phone1: "(555) 567-0123", phone1Ext: "200", address1: "913 Rose Lane", address2: "Apt 7", city: "Kansas City", state: "MO", zipCode: "64105", country: "United States", emergencyContactName: "Kenneth Green", emergencyContactPhone: "(555) 567-0124", emergencyContactRelationship: "Son" },
      
      { email: "kenneth.stewart@example.com", firstName: "Kenneth", lastName: "Stewart", prnNumber: "10026", title: "Mr.", organization: "Stewart Finance", phone1: "(555) 678-1234", phone1Ext: "", address1: "024 Daisy Drive", address2: "Office 8", city: "Mesa", state: "AZ", zipCode: "85201", country: "United States", emergencyContactName: "Brenda Stewart", emergencyContactPhone: "(555) 678-1235", emergencyContactRelationship: "Spouse" },
      { email: "brenda.sanchez@example.com", firstName: "Brenda", lastName: "Sanchez", prnNumber: "10027", title: "Ms.", organization: "Sanchez Design", phone1: "(555) 789-2345", phone1Ext: "ext", address1: "135 Lily Street", address2: "", city: "Virginia Beach", state: "VA", zipCode: "23450", country: "United States", emergencyContactName: "Lawrence Sanchez", emergencyContactPhone: "(555) 789-2346", emergencyContactRelationship: "Brother" },
      { email: "lawrence.morris@example.com", firstName: "Lawrence", lastName: "Morris", prnNumber: "10028", title: "Mr.", organization: "Morris Tech", phone1: "(555) 890-3456", phone1Ext: "105", address1: "246 Pansy Road", address2: "Ste 200", city: "Atlanta", state: "GA", zipCode: "30303", country: "United States", emergencyContactName: "Ann Morris", emergencyContactPhone: "(555) 890-3457", emergencyContactRelationship: "Sister" },
      { email: "ann.rogers@example.com", firstName: "Ann", lastName: "Rogers", prnNumber: "10029", title: "Mrs.", organization: "Rogers Trust", phone1: "(555) 901-4567", phone1Ext: "", address1: "357 Petunia Avenue", address2: "Apt 5", city: "New York", state: "NY", zipCode: "10002", country: "United States", emergencyContactName: "Dennis Rogers", emergencyContactPhone: "(555) 901-4568", emergencyContactRelationship: "Spouse" },
      { email: "dennis.reed@example.com", firstName: "Dennis", lastName: "Reed", prnNumber: "10030", title: "Mr.", organization: "Reed Associates", phone1: "(555) 012-5678", phone1Ext: "ext", address1: "468 Crocus Lane", address2: "", city: "Los Angeles", state: "CA", zipCode: "90002", country: "United States", emergencyContactName: "Carol Reed", emergencyContactPhone: "(555) 012-5679", emergencyContactRelationship: "Daughter" },
      
      { email: "carol.cook@example.com", firstName: "Carol", lastName: "Cook", prnNumber: "10031", title: "Ms.", organization: "Cook Catering", phone1: "(555) 123-7890", phone1Ext: "110", address1: "579 Bluebell Drive", address2: "", city: "Chicago", state: "IL", zipCode: "60602", country: "United States", emergencyContactName: "Ronald Cook", emergencyContactPhone: "(555) 123-7891", emergencyContactRelationship: "Son" },
      { email: "ronald.bell@example.com", firstName: "Ronald", lastName: "Bell", prnNumber: "10032", title: "Mr.", organization: "Bell Manufacturing", phone1: "(555) 234-8901", phone1Ext: "", address1: "680 Snowdrop Street", address2: "Unit 12", city: "Houston", state: "TX", zipCode: "77002", country: "United States", emergencyContactName: "Sandra Bell", emergencyContactPhone: "(555) 234-8902", emergencyContactRelationship: "Spouse" },
      { email: "sandra.ward@example.com", firstName: "Sandra", lastName: "Ward", prnNumber: "10033", title: "Mrs.", organization: "Ward Builders", phone1: "(555) 345-9012", phone1Ext: "ext", address1: "791 Sunflower Road", address2: "", city: "Phoenix", state: "AZ", zipCode: "85002", country: "United States", emergencyContactName: "Paul Ward", emergencyContactPhone: "(555) 345-9013", emergencyContactRelationship: "Brother" },
      { email: "paul.cox@example.com", firstName: "Paul", lastName: "Cox", prnNumber: "10034", title: "Mr.", organization: "Cox Architects", phone1: "(555) 456-0123", phone1Ext: "220", address1: "802 Marigold Avenue", address2: "Ste 4", city: "Philadelphia", state: "PA", zipCode: "19102", country: "United States", emergencyContactName: "Kathleen Cox", emergencyContactPhone: "(555) 456-0124", emergencyContactRelationship: "Sister" },
      { email: "kathleen.richardson@example.com", firstName: "Kathleen", lastName: "Richardson", prnNumber: "10035", title: "Dr.", organization: "Richardson Medical", phone1: "(555) 567-1234", phone1Ext: "", address1: "913 Aster Lane", address2: "Apt 8", city: "San Antonio", state: "TX", zipCode: "78202", country: "United States", emergencyContactName: "Mark Richardson", emergencyContactPhone: "(555) 567-1235", emergencyContactRelationship: "Spouse" },
    ];

    const createdUserIds: string[] = [];

    for (const mockCustomer of mockCustomers) {
      // Create user or get existing user
      let user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, mockCustomer.email),
      });

      if (!user) {
        const [newUser] = await db
          .insert(users)
          .values({
            email: mockCustomer.email,
            firstName: mockCustomer.firstName,
            lastName: mockCustomer.lastName,
            role: "customer",
          })
          .returning();
        
        user = newUser;
        console.log(`✅ Created user: ${mockCustomer.email}`);
      } else {
        console.log(`✅ Using existing user: ${mockCustomer.email}`);
      }

      createdUserIds.push(user.id);

      // Check if customer profile already exists
      const existingCustomer = await db.query.customers.findFirst({
        where: (customers, { eq }) => eq(customers.userId, user.id),
      });

      let customer = existingCustomer;
      
      if (!existingCustomer) {
        const [newCustomer] = await db
          .insert(customers)
          .values({
            userId: user.id,
            prnNumber: mockCustomer.prnNumber,
            title: mockCustomer.title,
            organization: mockCustomer.organization,
            address1: mockCustomer.address1,
            address2: mockCustomer.address2,
            city: mockCustomer.city,
            state: mockCustomer.state,
            zipCode: mockCustomer.zipCode,
            country: mockCustomer.country,
            phone1: mockCustomer.phone1,
            phone1Ext: mockCustomer.phone1Ext,
            emergencyContactName: mockCustomer.emergencyContactName,
            emergencyContactPhone: mockCustomer.emergencyContactPhone,
            emergencyContactRelationship: mockCustomer.emergencyContactRelationship,
            idCardNumber: `ALWR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          })
          .returning();
        
        customer = newCustomer;
        console.log(`✅ Created customer profile for ${mockCustomer.firstName}`);
      } else {
        // Update existing customer with new field values
        await db
          .update(customers)
          .set({
            prnNumber: mockCustomer.prnNumber,
            title: mockCustomer.title,
            organization: mockCustomer.organization,
            address1: mockCustomer.address1,
            address2: mockCustomer.address2,
            country: mockCustomer.country,
            phone1: mockCustomer.phone1,
            phone1Ext: mockCustomer.phone1Ext,
          })
          .where(eq(customers.id, existingCustomer.id));
        
        customer = existingCustomer;
        console.log(`✅ Updated customer profile for ${mockCustomer.firstName} with new fields`);
      }

      // Check if subscriptions already exist
      const existingSubscriptions = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.customerId, customer.id),
      });

      if (existingSubscriptions.length === 0) {
        // Create past subscriptions (inactive = past/expired)
        const now = new Date();
        
        // Past subscription 1 (ended 2 years ago)
        const past1Start = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
        const past1End = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        await db.insert(subscriptions).values({
          customerId: customer.id,
          status: "inactive",
          startDate: past1Start,
          endDate: past1End,
          renewalDate: past1End,
          amount: 2995,
          currency: "usd",
        });

        // Past subscription 2 (ended 1 year ago)
        const past2Start = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        const past2End = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        await db.insert(subscriptions).values({
          customerId: customer.id,
          status: "inactive",
          startDate: past2Start,
          endDate: past2End,
          renewalDate: past2End,
          amount: 2995,
          currency: "usd",
        });

        // Current active subscription
        const activeStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // Started 6 months ago
        const activeEnd = new Date(now.getTime() + 185 * 24 * 60 * 60 * 1000); // Expires in ~6 months
        await db.insert(subscriptions).values({
          customerId: customer.id,
          status: "active",
          startDate: activeStart,
          endDate: activeEnd,
          renewalDate: activeEnd,
          amount: 2995,
          currency: "usd",
        });

        console.log(`✅ Created 3 subscriptions (2 past, 1 active) for ${mockCustomer.firstName}`);
      } else {
        console.log(`✅ Using existing subscriptions for ${mockCustomer.firstName}`);
      }

      // Check if documents already exist
      const existingDocuments = await db.query.documents.findMany({
        where: (documents, { eq }) => eq(documents.customerId, customer.id),
      });

      if (existingDocuments.length === 0) {
        const documentTypes = ["living_will", "healthcare_directive", "power_of_attorney"];
        for (let i = 0; i < 2; i++) {
          await db.insert(documents).values({
            customerId: customer.id,
            fileName: `${mockCustomer.firstName}_${documentTypes[i]}.pdf`,
            fileType: documentTypes[i] as any,
            fileSize: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
            mimeType: "application/pdf",
            storageKey: `documents/${customer.id}/${documentTypes[i]}_${Date.now()}.pdf`,
            description: `${documentTypes[i].replace(/_/g, " ")} for ${mockCustomer.firstName}`,
            uploadedBy: user.id,
          });
        }

        console.log(`✅ Created 2 documents for ${mockCustomer.firstName}`);
      } else {
        console.log(`✅ Using existing documents for ${mockCustomer.firstName}`);
      }

      // Check if notes already exist
      const existingNotes = await db.query.customerNotes.findMany({
        where: (customerNotes, { eq }) => eq(customerNotes.customerId, customer.id),
      });

      if (existingNotes.length === 0) {
        const sampleNotes = [
          "Called customer on 11/15 - confirmed all documents are current",
          "Upgraded to annual plan - will save $5/month",
          "Customer requested emergency contact update - processed successfully",
          "Renewal reminder sent - customer acknowledged receipt",
        ];

        for (let i = 0; i < Math.min(2, sampleNotes.length); i++) {
          await db.insert(customerNotes).values({
            customerId: customer.id,
            userId: user.id,
            noteText: sampleNotes[i],
          });
        }

        console.log(`✅ Created notes for ${mockCustomer.firstName}`);
      } else {
        console.log(`✅ Using existing notes for ${mockCustomer.firstName}`);
      }
    }

    // Create mock agents with all new fields
    const mockAgents = [
      { email: "agent.john@example.com", firstName: "John", lastName: "Agent", pinNumber: "10575", agentType: "individual_agent" as const, title: "Senior Agent", organization: "First Care Agency", address1: "100 Agent Street", address2: "Suite 101", city: "Springfield", state: "IL", zipCode: "62701", country: "United States", phone1: "(555) 100-0001", phone1Ext: "ext", phone2: "(555) 100-0010", phone2Ext: "", agencyName: "First Care Agency", agencyPhone: "(555) 100-0001", agencyAddress: "100 Agent Street, Springfield, IL 62701" },
      { email: "agent.sarah@example.com", firstName: "Sarah", lastName: "Provider", pinNumber: "10576", agentType: "organizational_agent" as const, title: "Director", organization: "Healthcare Plus", address1: "200 Care Avenue", address2: "", city: "Chicago", state: "IL", zipCode: "60601", country: "United States", phone1: "(555) 100-0002", phone1Ext: "", phone2: "", phone2Ext: "", agencyName: "Healthcare Plus", agencyPhone: "(555) 100-0002", agencyAddress: "200 Care Avenue, Chicago, IL 60601" },
      { email: "agent.mike@example.com", firstName: "Mike", lastName: "Coordinator", pinNumber: "10577", agentType: "individual_agent" as const, title: "Agent", organization: "Senior Services Co", address1: "300 Service Road", address2: "Building B", city: "Rockford", state: "IL", zipCode: "61101", country: "United States", phone1: "(555) 100-0003", phone1Ext: "102", phone2: "", phone2Ext: "", agencyName: "Senior Services Co", agencyPhone: "(555) 100-0003", agencyAddress: "300 Service Road, Rockford, IL 61101" },
    ];

    console.log("\n🌱 Seeding mock agents...");
    for (const mockAgent of mockAgents) {
      const [user] = await db
        .insert(users)
        .values({
          email: mockAgent.email,
          firstName: mockAgent.firstName,
          lastName: mockAgent.lastName,
          role: "agent",
        })
        .onConflictDoNothing()
        .returning();

      if (user) {
        // Check if agent already exists
        const existingAgent = await db.query.agents.findFirst({
          where: (agents, { eq }) => eq(agents.userId, user.id),
        });

        if (!existingAgent) {
          await db
            .insert(agents)
            .values({
              userId: user.id,
              status: "active",
              pinNumber: mockAgent.pinNumber,
              agentType: mockAgent.agentType,
              title: mockAgent.title,
              organization: mockAgent.organization,
              address1: mockAgent.address1,
              address2: mockAgent.address2,
              city: mockAgent.city,
              state: mockAgent.state,
              zipCode: mockAgent.zipCode,
              country: mockAgent.country,
              phone1: mockAgent.phone1,
              phone1Ext: mockAgent.phone1Ext,
              phone2: mockAgent.phone2,
              phone2Ext: mockAgent.phone2Ext,
              agencyName: mockAgent.agencyName,
              agencyPhone: mockAgent.agencyPhone,
              agencyAddress: mockAgent.agencyAddress,
              licenseNumber: `LIC-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              licenseExpiresAt: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000),
              commissionRate: "15.5",
            })
            .returning();
          console.log(`✅ Created agent: ${mockAgent.firstName} ${mockAgent.lastName}`);
        } else {
          // Update existing agent with new field values
          await db
            .update(agents)
            .set({
              pinNumber: mockAgent.pinNumber,
              agentType: mockAgent.agentType,
              title: mockAgent.title,
              organization: mockAgent.organization,
              address1: mockAgent.address1,
              address2: mockAgent.address2,
              city: mockAgent.city,
              state: mockAgent.state,
              zipCode: mockAgent.zipCode,
              country: mockAgent.country,
              phone1: mockAgent.phone1,
              phone1Ext: mockAgent.phone1Ext,
              phone2: mockAgent.phone2,
              phone2Ext: mockAgent.phone2Ext,
            })
            .where(eq(agents.id, existingAgent.id));
          console.log(`✅ Updated agent: ${mockAgent.firstName} ${mockAgent.lastName} with new fields`);
        }
      }
    }

    // Create mock resellers with all new fields
    const mockResellers = [
      { email: "reseller.corporate@example.com", firstName: "Bob", lastName: "Reseller", contactGroup: "event_registrants" as const, title: "President", organization: "HealthDoc Resellers Inc", address1: "500 Business Park", address2: "Suite 200", city: "New York", state: "NY", zipCode: "10001", country: "United States", phone: "(555) 200-0001", mobilePhone: "(555) 200-0011", fax: "(555) 200-0021", webSiteUrl: "https://healthdoc.com", industry: "Healthcare", extendedValues: [{ key: "event_name", value: "Healthcare Conference 2024" }, { key: "vip_status", value: "yes" }], companyName: "HealthDoc Resellers Inc", companyPhone: "(555) 200-0001", companyAddress: "500 Business Park, New York, NY 10001", taxId: "12-3456789", partnerTier: "premium", commissionRate: "20.0" },
      { email: "reseller.team@example.com", firstName: "Alice", lastName: "Partner", contactGroup: "info_seekers" as const, title: "VP Sales", organization: "Care Solutions Network", address1: "600 Enterprise Way", address2: "Building C", city: "Los Angeles", state: "CA", zipCode: "90001", country: "United States", phone: "(555) 200-0002", mobilePhone: "(555) 200-0012", fax: "", webSiteUrl: "https://caresolutions.com", industry: "Senior Care", extendedValues: [{ key: "inquiry_topic", value: "Estate Planning" }, { key: "follow_up_date", value: "2024-12-15" }], companyName: "Care Solutions Network", companyPhone: "(555) 200-0002", companyAddress: "600 Enterprise Way, Los Angeles, CA 90001", taxId: "98-7654321", partnerTier: "standard", commissionRate: "15.0" },
      { email: "reseller.groups@example.com", firstName: "David", lastName: "Sales", contactGroup: "pennies_peace_of_mind" as const, title: "Director", organization: "Senior Life Partners", address1: "700 Partnership Lane", address2: "Unit 5", city: "Houston", state: "TX", zipCode: "77001", country: "United States", phone: "(555) 200-0003", mobilePhone: "(555) 200-0013", fax: "(555) 200-0023", webSiteUrl: "https://seniorlifepartners.com", industry: "Financial Services", extendedValues: [{ key: "membership_level", value: "Gold" }, { key: "referral_commission_tier", value: "Premium" }, { key: "vip_status", value: "yes" }], companyName: "Senior Life Partners", companyPhone: "(555) 200-0003", companyAddress: "700 Partnership Lane, Houston, TX 77001", taxId: "55-1234567", partnerTier: "enterprise", commissionRate: "25.0" },
    ];

    console.log("🌱 Seeding mock resellers...");
    for (const mockReseller of mockResellers) {
      const [user] = await db
        .insert(users)
        .values({
          email: mockReseller.email,
          firstName: mockReseller.firstName,
          lastName: mockReseller.lastName,
          role: "customer",  // Use customer role - reseller is tracked via resellers table
        })
        .onConflictDoNothing()
        .returning();

      if (user) {
        // Check if reseller already exists
        const existingReseller = await db.query.resellers.findFirst({
          where: (resellers, { eq }) => eq(resellers.userId, user.id),
        });

        if (!existingReseller) {
          await db
            .insert(resellers)
            .values({
              userId: user.id,
              status: "active",
              contactGroup: mockReseller.contactGroup,
              firstName: mockReseller.firstName,
              lastName: mockReseller.lastName,
              title: mockReseller.title,
              organization: mockReseller.organization,
              address1: mockReseller.address1,
              address2: mockReseller.address2,
              city: mockReseller.city,
              state: mockReseller.state,
              zipCode: mockReseller.zipCode,
              country: mockReseller.country,
              phone: mockReseller.phone,
              mobilePhone: mockReseller.mobilePhone,
              fax: mockReseller.fax,
              webSiteUrl: mockReseller.webSiteUrl,
              industry: mockReseller.industry,
              extendedValues: mockReseller.extendedValues as any,
              companyName: mockReseller.companyName,
              companyPhone: mockReseller.companyPhone,
              companyAddress: mockReseller.companyAddress,
              taxId: mockReseller.taxId,
              partnerTier: mockReseller.partnerTier,
              commissionRate: mockReseller.commissionRate,
              paymentTerms: "net30",
            })
            .returning();
          console.log(`✅ Created reseller: ${mockReseller.firstName} ${mockReseller.lastName}`);
        } else {
          // Update existing reseller with new field values
          await db
            .update(resellers)
            .set({
              contactGroup: mockReseller.contactGroup,
              firstName: mockReseller.firstName,
              lastName: mockReseller.lastName,
              title: mockReseller.title,
              organization: mockReseller.organization,
              address1: mockReseller.address1,
              address2: mockReseller.address2,
              city: mockReseller.city,
              state: mockReseller.state,
              zipCode: mockReseller.zipCode,
              country: mockReseller.country,
              phone: mockReseller.phone,
              mobilePhone: mockReseller.mobilePhone,
              fax: mockReseller.fax,
              webSiteUrl: mockReseller.webSiteUrl,
              industry: mockReseller.industry,
              extendedValues: mockReseller.extendedValues as any,
            })
            .where(eq(resellers.id, existingReseller.id));
          console.log(`✅ Updated reseller: ${mockReseller.firstName} ${mockReseller.lastName} with new fields`);
        }
      }
    }

    console.log("\n✨ Mock data seeding complete!");
    console.log(`Created ${createdUserIds.length} customers with profiles, subscriptions, documents, and notes`);
    console.log(`Created ${mockAgents.length} agents and ${mockResellers.length} resellers`);

  } catch (error) {
    console.error("❌ Error seeding mock data:", error);
    throw error;
  }
}

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedMockData()
    .then(() => {
      console.log("\n✅ Seeding finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Seeding failed:", error);
      process.exit(1);
    });
}

export { seedMockData };
