import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Invitation Service
export class InvitationService {
    // Create a new invitation
    static async createInvitation(unitId: string, email: string, role: string, createdById: string) {
      // Generate a unique token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const invitation = await prisma.invitation.create({
        data: {
          email,
          token,
          expires,
          role,
          unit: { connect: { id: unitId } },
          createdBy: { connect: { id: createdById } }
        }
      });
      
      return invitation;
    }
    
    // Verify and use an invitation
    static async acceptInvitation(token: string, userId: string) {
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: { unit: true }
      });
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }
      
      if (invitation.expires < new Date()) {
        await prisma.invitation.delete({ where: { id: invitation.id } });
        throw new Error('Invitation has expired');
      }
      
      // Create unit member with the role from invitation
      const unitMember = await prisma.unitMember.create({
        data: {
          role: invitation.role,
          user: { connect: { id: userId } },
          unit: { connect: { id: invitation.unitId } }
        }
      });
      
      // Delete the used invitation
      await prisma.invitation.delete({ where: { id: invitation.id } });
      
      return { unitMember, unit: invitation.unit };
    }
    
    // Get all pending invitations for a unit
    static async getUnitInvitations(unitId: string) {
      return prisma.invitation.findMany({
        where: { unitId },
        include: { createdBy: { select: { username: true, email: true } } }
      });
    }
    
    // Delete an invitation
    static async deleteInvitation(id: string) {
      return prisma.invitation.delete({ where: { id } });
    }
  }