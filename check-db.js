const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, name: u.name, displayName: u.displayName })));
  
  const convos = await prisma.conversation.findMany({
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });
  console.log("Conversations:", convos.map(c => ({
    id: c.id,
    type: c.type,
    members: c.members.map(m => m.user.email)
  })));

  const messages = await prisma.message.findMany();
  console.log("Messages:", messages.map(m => ({ id: m.id, content: m.content, senderId: m.senderId })));
}

main().catch(err => {
  console.error("Error:", err);
}).finally(() => prisma.$disconnect());
