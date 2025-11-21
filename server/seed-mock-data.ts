import { db } from "./db";
import { users, customers, subscriptions, documents, customerNotes } from "@shared/schema";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedMockData() {
  console.log("🌱 Seeding mock customer data...");

  try {
    // Create mock users and customers
    const mockCustomers = [
      {
        email: "john.smith@example.com",
        firstName: "John",
        lastName: "Smith",
        phone: "(555) 123-4567",
        address: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        emergencyContactName: "Mary Smith",
        emergencyContactPhone: "(555) 123-4568",
        emergencyContactRelationship: "Spouse",
      },
      {
        email: "sarah.johnson@example.com",
        firstName: "Sarah",
        lastName: "Johnson",
        phone: "(555) 234-5678",
        address: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90001",
        emergencyContactName: "David Johnson",
        emergencyContactPhone: "(555) 234-5679",
        emergencyContactRelationship: "Son",
      },
      {
        email: "michael.brown@example.com",
        firstName: "Michael",
        lastName: "Brown",
        phone: "(555) 345-6789",
        address: "789 Pine Road",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        emergencyContactName: "Jennifer Brown",
        emergencyContactPhone: "(555) 345-6790",
        emergencyContactRelationship: "Daughter",
      },
      {
        email: "elizabeth.davis@example.com",
        firstName: "Elizabeth",
        lastName: "Davis",
        phone: "(555) 456-7890",
        address: "321 Elm Street",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        emergencyContactName: "Robert Davis",
        emergencyContactPhone: "(555) 456-7891",
        emergencyContactRelationship: "Brother",
      },
      {
        email: "william.miller@example.com",
        firstName: "William",
        lastName: "Miller",
        phone: "(555) 567-8901",
        address: "654 Maple Drive",
        city: "Phoenix",
        state: "AZ",
        zipCode: "85001",
        emergencyContactName: "Linda Miller",
        emergencyContactPhone: "(555) 567-8902",
        emergencyContactRelationship: "Sister",
      },
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
          idCardNumber: `ALWR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
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
