import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Define roles and their hierarchy
export const UNIT_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member'
};

// Role permission mapping
export const ROLE_PERMISSIONS = {
  [UNIT_ROLES.ADMIN]: [
    'manage_members',
    'manage_roles',
    'manage_unit',
    'create_tasks',
    'assign_tasks',
    'complete_tasks',
    'delete_tasks'
  ],
  [UNIT_ROLES.MODERATOR]: [
    'create_tasks',
    'assign_tasks',
    'complete_tasks',
    'delete_tasks'
  ],
  [UNIT_ROLES.MEMBER]: [
    'create_tasks',
    'complete_tasks'
  ]
};

export class UnitMemberService {
  // Update a member's role
  static async updateMemberRole(unitId: string, memberId: string, newRole: string, requesterId: string) {
    // Check if requester is admin
    const requesterMembership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: requesterId,
          unitId
        }
      }
    });
    
    if (!requesterMembership || requesterMembership.role !== UNIT_ROLES.ADMIN) {
      throw new Error('Only admins can update member roles');
    }
    
    // Check if role is valid
    if (!Object.values(UNIT_ROLES).includes(newRole)) {
      throw new Error('Invalid role');
    }
    
    // Prevent removing the last admin
    if (newRole !== UNIT_ROLES.ADMIN) {
      const adminCount = await prisma.unitMember.count({
        where: {
          unitId,
          role: UNIT_ROLES.ADMIN
        }
      });
      
      if (adminCount <= 1) {
        const currentMember = await prisma.unitMember.findUnique({
          where: { id: memberId }
        });
        
        if (currentMember?.role === UNIT_ROLES.ADMIN) {
          throw new Error('Cannot remove the last admin from a unit');
        }
      }
    }
    
    // Update the member's role
    return prisma.unitMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: { user: { select: { id: true, username: true, email: true } } }
    });
  }
  
  // Remove a member from a unit
  static async removeMember(unitId: string, memberId: string, requesterId: string) {
    // Check if requester is admin
    const requesterMembership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: requesterId,
          unitId
        }
      }
    });
    
    if (!requesterMembership || requesterMembership.role !== UNIT_ROLES.ADMIN) {
      throw new Error('Only admins can remove members');
    }
    
    const memberToRemove = await prisma.unitMember.findUnique({
      where: { id: memberId }
    });
    
    // Prevent removing the last admin
    if (memberToRemove?.role === UNIT_ROLES.ADMIN) {
      const adminCount = await prisma.unitMember.count({
        where: {
          unitId,
          role: UNIT_ROLES.ADMIN
        }
      });
      
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin from a unit');
      }
    }
    
    // Delete assigned tasks or reassign them
    await prisma.task.updateMany({
      where: {
        unitId,
        assigneeId: memberToRemove?.userId
      },
      data: {
        assigneeId: null
      }
    });
    
    // Remove the member
    return prisma.unitMember.delete({
      where: { id: memberId }
    });
  }
  
  // Get all members of a unit with their roles
  static async getUnitMembers(unitId: string) {
    return prisma.unitMember.findMany({
      where: { unitId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
  }
  
  // Check if a user has specific permission in a unit
  static async hasPermission(userId: string, unitId: string, permission: string) {
    const membership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId,
          unitId
        }
      }
    });
    
    if (!membership) {
      return false;
    }
    
    const userRole = membership.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    
    return permissions.includes(permission);
  }
}
