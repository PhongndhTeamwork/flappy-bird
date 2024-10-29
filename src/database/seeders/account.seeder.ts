import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const main = async (quantity : number) => {
  const telegramId = 6287487587;
  for (let i = 0; i < quantity; i++) {
    const gender = Math.floor(Math.random() *2);
    await prisma.account.create({
      data: {
        telegramId: (telegramId + i).toString(),
        firstName: faker.person.firstName(gender === 0 ? "male" : "female"),
        lastName: faker.person.lastName(gender === 0 ? "male" : "female"),
        username : faker.person.fullName()
      }
    });
  }
  console.log("Seeding account completed.");
}

main(10)
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });