import { db } from "./db";
import { users, customers, subscriptions, documents, customerNotes } from "@shared/schema";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedMockData() {
  console.log("🌱 Seeding mock customer data...");

  try {
    // Create mock users and customers - expanded to 35+ customers
    const mockCustomers = [
      // Original 5
      { email: "john.smith@example.com", firstName: "John", lastName: "Smith", phone: "(555) 123-4567", address: "123 Main Street", city: "New York", state: "NY", zipCode: "10001", emergencyContactName: "Mary Smith", emergencyContactPhone: "(555) 123-4568", emergencyContactRelationship: "Spouse" },
      { email: "sarah.johnson@example.com", firstName: "Sarah", lastName: "Johnson", phone: "(555) 234-5678", address: "456 Oak Avenue", city: "Los Angeles", state: "CA", zipCode: "90001", emergencyContactName: "David Johnson", emergencyContactPhone: "(555) 234-5679", emergencyContactRelationship: "Son" },
      { email: "michael.brown@example.com", firstName: "Michael", lastName: "Brown", phone: "(555) 345-6789", address: "789 Pine Road", city: "Chicago", state: "IL", zipCode: "60601", emergencyContactName: "Jennifer Brown", emergencyContactPhone: "(555) 345-6790", emergencyContactRelationship: "Daughter" },
      { email: "elizabeth.davis@example.com", firstName: "Elizabeth", lastName: "Davis", phone: "(555) 456-7890", address: "321 Elm Street", city: "Houston", state: "TX", zipCode: "77001", emergencyContactName: "Robert Davis", emergencyContactPhone: "(555) 456-7891", emergencyContactRelationship: "Brother" },
      { email: "william.miller@example.com", firstName: "William", lastName: "Miller", phone: "(555) 567-8901", address: "654 Maple Drive", city: "Phoenix", state: "AZ", zipCode: "85001", emergencyContactName: "Linda Miller", emergencyContactPhone: "(555) 567-8902", emergencyContactRelationship: "Sister" },
      
      // Additional 30+ customers
      { email: "james.wilson@example.com", firstName: "James", lastName: "Wilson", phone: "(555) 678-9012", address: "987 Cedar Lane", city: "Philadelphia", state: "PA", zipCode: "19101", emergencyContactName: "Patricia Wilson", emergencyContactPhone: "(555) 678-9013", emergencyContactRelationship: "Spouse" },
      { email: "maria.garcia@example.com", firstName: "Maria", lastName: "Garcia", phone: "(555) 789-0123", address: "135 Birch Street", city: "San Antonio", state: "TX", zipCode: "78201", emergencyContactName: "Carlos Garcia", emergencyContactPhone: "(555) 789-0124", emergencyContactRelationship: "Son" },
      { email: "robert.martinez@example.com", firstName: "Robert", lastName: "Martinez", phone: "(555) 890-1234", address: "246 Spruce Road", city: "San Diego", state: "CA", zipCode: "92101", emergencyContactName: "Angela Martinez", emergencyContactPhone: "(555) 890-1235", emergencyContactRelationship: "Daughter" },
      { email: "linda.anderson@example.com", firstName: "Linda", lastName: "Anderson", phone: "(555) 901-2345", address: "357 Willow Drive", city: "Dallas", state: "TX", zipCode: "75201", emergencyContactName: "Thomas Anderson", emergencyContactPhone: "(555) 901-2346", emergencyContactRelationship: "Brother" },
      { email: "charles.taylor@example.com", firstName: "Charles", lastName: "Taylor", phone: "(555) 012-3456", address: "468 Ash Avenue", city: "Austin", state: "TX", zipCode: "78701", emergencyContactName: "Margaret Taylor", emergencyContactPhone: "(555) 012-3457", emergencyContactRelationship: "Sister" },
      
      { email: "patricia.thomas@example.com", firstName: "Patricia", lastName: "Thomas", phone: "(555) 123-5678", address: "579 Hickory Lane", city: "Jacksonville", state: "FL", zipCode: "32099", emergencyContactName: "Richard Thomas", emergencyContactPhone: "(555) 123-5679", emergencyContactRelationship: "Spouse" },
      { email: "richard.jackson@example.com", firstName: "Richard", lastName: "Jackson", phone: "(555) 234-6789", address: "680 Sycamore Street", city: "Memphis", state: "TN", zipCode: "37501", emergencyContactName: "Susan Jackson", emergencyContactPhone: "(555) 234-6790", emergencyContactRelationship: "Daughter" },
      { email: "susan.white@example.com", firstName: "Susan", lastName: "White", phone: "(555) 345-7890", address: "791 Cottonwood Road", city: "Baltimore", state: "MD", zipCode: "21202", emergencyContactName: "Michael White", emergencyContactPhone: "(555) 345-7891", emergencyContactRelationship: "Son" },
      { email: "thomas.harris@example.com", firstName: "Thomas", lastName: "Harris", phone: "(555) 456-8901", address: "802 Dogwood Drive", city: "Boston", state: "MA", zipCode: "02101", emergencyContactName: "Nancy Harris", emergencyContactPhone: "(555) 456-8902", emergencyContactRelationship: "Spouse" },
      { email: "margaret.martin@example.com", firstName: "Margaret", lastName: "Martin", phone: "(555) 567-9012", address: "913 Redbud Avenue", city: "Seattle", state: "WA", zipCode: "98101", emergencyContactName: "Steven Martin", emergencyContactPhone: "(555) 567-9013", emergencyContactRelationship: "Brother" },
      
      { email: "steven.perez@example.com", firstName: "Steven", lastName: "Perez", phone: "(555) 678-0123", address: "024 Chestnut Lane", city: "Denver", state: "CO", zipCode: "80202", emergencyContactName: "Diana Perez", emergencyContactPhone: "(555) 678-0124", emergencyContactRelationship: "Sister" },
      { email: "nancy.robinson@example.com", firstName: "Nancy", lastName: "Robinson", phone: "(555) 789-1234", address: "135 Magnolia Drive", city: "Miami", state: "FL", zipCode: "33101", emergencyContactName: "Frank Robinson", emergencyContactPhone: "(555) 789-1235", emergencyContactRelationship: "Spouse" },
      { email: "frank.walker@example.com", firstName: "Frank", lastName: "Walker", phone: "(555) 890-2345", address: "246 Laurel Street", city: "Portland", state: "OR", zipCode: "97201", emergencyContactName: "Judith Walker", emergencyContactPhone: "(555) 890-2346", emergencyContactRelationship: "Daughter" },
      { email: "judith.young@example.com", firstName: "Judith", lastName: "Young", phone: "(555) 901-3456", address: "357 Juniper Road", city: "Las Vegas", state: "NV", zipCode: "89101", emergencyContactName: "Edward Young", emergencyContactPhone: "(555) 901-3457", emergencyContactRelationship: "Son" },
      { email: "edward.king@example.com", firstName: "Edward", lastName: "King", phone: "(555) 012-4567", address: "468 Poplar Avenue", city: "New Orleans", state: "LA", zipCode: "70112", emergencyContactName: "Dorothy King", emergencyContactPhone: "(555) 012-4568", emergencyContactRelationship: "Spouse" },
      
      { email: "dorothy.wright@example.com", firstName: "Dorothy", lastName: "Wright", phone: "(555) 123-6789", address: "579 Tulip Lane", city: "Fresno", state: "CA", zipCode: "93650", emergencyContactName: "Ralph Wright", emergencyContactPhone: "(555) 123-6790", emergencyContactRelationship: "Brother" },
      { email: "ralph.lopez@example.com", firstName: "Ralph", lastName: "Lopez", phone: "(555) 234-7890", address: "680 Orchid Street", city: "Sacramento", state: "CA", zipCode: "95814", emergencyContactName: "Betty Lopez", emergencyContactPhone: "(555) 234-7891", emergencyContactRelationship: "Sister" },
      { email: "betty.lee@example.com", firstName: "Betty", lastName: "Lee", phone: "(555) 345-8901", address: "791 Iris Road", city: "Long Beach", state: "CA", zipCode: "90801", emergencyContactName: "George Lee", emergencyContactPhone: "(555) 345-8902", emergencyContactRelationship: "Spouse" },
      { email: "george.allen@example.com", firstName: "George", lastName: "Allen", phone: "(555) 456-9012", address: "802 Violet Avenue", city: "Oakland", state: "CA", zipCode: "94601", emergencyContactName: "Helen Allen", emergencyContactPhone: "(555) 456-9013", emergencyContactRelationship: "Daughter" },
      { email: "helen.green@example.com", firstName: "Helen", lastName: "Green", phone: "(555) 567-0123", address: "913 Rose Lane", city: "Kansas City", state: "MO", zipCode: "64105", emergencyContactName: "Kenneth Green", emergencyContactPhone: "(555) 567-0124", emergencyContactRelationship: "Son" },
      
      { email: "kenneth.stewart@example.com", firstName: "Kenneth", lastName: "Stewart", phone: "(555) 678-1234", address: "024 Daisy Drive", city: "Mesa", state: "AZ", zipCode: "85201", emergencyContactName: "Brenda Stewart", emergencyContactPhone: "(555) 678-1235", emergencyContactRelationship: "Spouse" },
      { email: "brenda.sanchez@example.com", firstName: "Brenda", lastName: "Sanchez", phone: "(555) 789-2345", address: "135 Lily Street", city: "Virginia Beach", state: "VA", zipCode: "23450", emergencyContactName: "Lawrence Sanchez", emergencyContactPhone: "(555) 789-2346", emergencyContactRelationship: "Brother" },
      { email: "lawrence.morris@example.com", firstName: "Lawrence", lastName: "Morris", phone: "(555) 890-3456", address: "246 Pansy Road", city: "Atlanta", state: "GA", zipCode: "30303", emergencyContactName: "Ann Morris", emergencyContactPhone: "(555) 890-3457", emergencyContactRelationship: "Sister" },
      { email: "ann.rogers@example.com", firstName: "Ann", lastName: "Rogers", phone: "(555) 901-4567", address: "357 Petunia Avenue", city: "New York", state: "NY", zipCode: "10002", emergencyContactName: "Dennis Rogers", emergencyContactPhone: "(555) 901-4568", emergencyContactRelationship: "Spouse" },
      { email: "dennis.reed@example.com", firstName: "Dennis", lastName: "Reed", phone: "(555) 012-5678", address: "468 Crocus Lane", city: "Los Angeles", state: "CA", zipCode: "90002", emergencyContactName: "Carol Reed", emergencyContactPhone: "(555) 012-5679", emergencyContactRelationship: "Daughter" },
      
      { email: "carol.cook@example.com", firstName: "Carol", lastName: "Cook", phone: "(555) 123-7890", address: "579 Bluebell Drive", city: "Chicago", state: "IL", zipCode: "60602", emergencyContactName: "Ronald Cook", emergencyContactPhone: "(555) 123-7891", emergencyContactRelationship: "Son" },
      { email: "ronald.bell@example.com", firstName: "Ronald", lastName: "Bell", phone: "(555) 234-8901", address: "680 Snowdrop Street", city: "Houston", state: "TX", zipCode: "77002", emergencyContactName: "Sandra Bell", emergencyContactPhone: "(555) 234-8902", emergencyContactRelationship: "Spouse" },
      { email: "sandra.ward@example.com", firstName: "Sandra", lastName: "Ward", phone: "(555) 345-9012", address: "791 Sunflower Road", city: "Phoenix", state: "AZ", zipCode: "85002", emergencyContactName: "Paul Ward", emergencyContactPhone: "(555) 345-9013", emergencyContactRelationship: "Brother" },
      { email: "paul.cox@example.com", firstName: "Paul", lastName: "Cox", phone: "(555) 456-0123", address: "802 Marigold Avenue", city: "Philadelphia", state: "PA", zipCode: "19102", emergencyContactName: "Kathleen Cox", emergencyContactPhone: "(555) 456-0124", emergencyContactRelationship: "Sister" },
      { email: "kathleen.richardson@example.com", firstName: "Kathleen", lastName: "Richardson", phone: "(555) 567-1234", address: "913 Aster Lane", city: "San Antonio", state: "TX", zipCode: "78202", emergencyContactName: "Mark Richardson", emergencyContactPhone: "(555) 567-1235", emergencyContactRelationship: "Spouse" },
    ];

    const createdUserIds: string[] = [];

    for (const mockCustomer of mockCustomers) {
      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email: mockCustomer.email,
          firstName: mockCustomer.firstName,
          lastName: mockCustomer.lastName,
          role: "customer",
        })
        .onConflictDoNothing()
        .returning();

      if (!user) {
        console.log(`⏭️  User ${mockCustomer.email} already exists, skipping...`);
        continue;
      }

      createdUserIds.push(user.id);
      console.log(`✅ Created user: ${mockCustomer.email}`);

      // Create customer profile
      const [customer] = await db
        .insert(customers)
        .values({
          userId: user.id,
          phone: mockCustomer.phone,
          address: mockCustomer.address,
          city: mockCustomer.city,
          state: mockCustomer.state,
          zipCode: mockCustomer.zipCode,
          emergencyContactName: mockCustomer.emergencyContactName,
          emergencyContactPhone: mockCustomer.emergencyContactPhone,
          emergencyContactRelationship: mockCustomer.emergencyContactRelationship,
          idCardNumber: `ALWR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        })
        .returning();

      console.log(`✅ Created customer profile for ${mockCustomer.firstName}`);

      // Create subscription
      const now = new Date();
      const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      await db
        .insert(subscriptions)
        .values({
          customerId: customer.id,
          status: Math.random() > 0.2 ? "active" : "expired",
          startDate: now,
          endDate: endDate,
          renewalDate: endDate,
          amount: 2995, // $29.95 in cents
          currency: "usd",
        })
        .returning();

      console.log(`✅ Created subscription for ${mockCustomer.firstName}`);

      // Create sample documents
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

      // Create customer notes
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
    }

    console.log("\n✨ Mock data seeding complete!");
    console.log(`Created ${createdUserIds.length} customers with profiles, subscriptions, documents, and notes`);

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
