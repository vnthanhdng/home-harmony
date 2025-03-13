import {Request, Response} from 'express';
import { PrismaClient } from '@prisma/client';
import {v4 as uuidv4} from 'uuid';

const prisma = new PrismaClient();

export const createUnit = async (req: Request, res: Response) => {
    try {
        const {name} = req.body;
        const userId = req.user.id;

        //create unit and add creator as admin in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // create the unit
            const unit = await tx.unit.create({
                data: {
                    name,
                },
            });

            const unitMember = await tx.unitMember.create({
                data: {
                    role: 'admin',
                    userId,
                    unitId: unit.id,
                },
            });

            return {unit, unitMember};
        });

        return res.status(201).json({message: 'Unit created successfully', data: result.unit});
    } catch (error) {
        console.error('Error creating unit:', error);
        return res.status(500).json({message: 'Error creating unit'});
    }
};

//get all units for current user
//they can be in multiple units (home, dorm, etc)
export const getUserUnits = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        const units = await prisma.unit.findMany({
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                _count: {
                    select: {
                        members: true,
                        tasks: true,
                    },
                },
            },
        });

        return res.status(200).json({data: units});
    } catch (error) {
        console.error('Error fetching units:', error);
        return res.status(500).json({message: 'Error fetching units'});
    }
};

//get details of a specific unit
export const getUnitDetails = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
  
      // check if user is a member of the unit
      const membership = await prisma.unitMember.findUnique({
        where: {
          userId_unitId: {
            userId,
            unitId: id,
          },
        },
      });
  
      if (!membership) {
        return res.status(403).json({ message: 'You are not a member of this unit' });
      }
  
      const unit = await prisma.unit.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          tasks: {
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
  
      if (!unit) {
        return res.status(404).json({ message: 'Unit not found' });
      }
  
      return res.status(200).json({ data: unit });
    } catch (error) {
      console.error('Error fetching unit details:', error);
      return res.status(500).json({ message: 'Error fetching unit details' });
    }
  };

// update unit
export const updateUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    // check if user is admin of the unit
    const membership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId,
          unitId: id,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update unit details' });
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json({ 
      message: 'Unit updated successfully',
      data: updatedUnit
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    return res.status(500).json({ message: 'Error updating unit' });
  }
};

// delete unit
export const deleteUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // check if user is admin of the unit
    const membership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId,
          unitId: id,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete units' });
    }

    // delete the unit (cascade should handle related records)
    await prisma.unit.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    return res.status(500).json({ message: 'Error deleting unit' });
  }
};

// invite a user to a unit
export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;
    const inviterId = req.user.id;

    // check if inviter is admin of the unit
    const membership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: inviterId,
          unitId: id,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can invite users' });
    }

    // find the user to invite
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }

    // check if user is already a member
    const existingMembership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: userToInvite.id,
          unitId: id,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({ message: 'User is already a member of this unit' });
    }

    // create invitation (using UnitMember with pending status)
    const invitation = await prisma.unitMember.create({
      data: {
        userId: userToInvite.id,
        unitId: id,
        role,
        status: 'pending',
      },
      include: {
        unit: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Here you would typically send an email notification
    // For now, we'll just return the invitation data

    return res.status(201).json({ 
      message: 'Invitation sent successfully',
      data: invitation
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return res.status(500).json({ message: 'Error sending invitation' });
  }
};

// Update member role
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    // Check if user is admin of the unit
    const membership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId,
          unitId: id,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update member roles' });
    }

    // Update the member's role
    const updatedMember = await prisma.unitMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({ 
      message: 'Member role updated successfully',
      data: updatedMember
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return res.status(500).json({ message: 'Error updating member role' });
  }
};

// Remove member from unit
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.id;

    // Check if user is admin of the unit or removing themselves
    const membership = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId,
          unitId: id,
        },
      },
    });

    const memberToRemove = await prisma.unitMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!memberToRemove) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Allow if user is admin or removing themselves
    if (!(membership?.role === 'admin' || memberToRemove.userId === userId)) {
      return res.status(403).json({ 
        message: 'Only admins can remove other members' 
      });
    }

    // Count admins to prevent removing the last admin
    if (memberToRemove.role === 'admin') {
      const adminCount = await prisma.unitMember.count({
        where: {
          unitId: id,
          role: 'admin',
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot remove the last admin. Assign another admin first.' 
        });
      }
    }

    // Remove the member
    await prisma.unitMember.delete({
      where: { id: memberId },
    });

    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return res.status(500).json({ message: 'Error removing member' });
  }
};

// Get invitations for current user
export const getUserInvitations = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const invitations = await prisma.unitMember.findMany({
      where: {
        userId,
        status: 'pending',
      },
      include: {
        unit: true,
      },
    });

    return res.status(200).json({ data: invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({ message: 'Error fetching invitations' });
  }
};

// Accept/reject invitation
export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;
    const userId = req.user.id;

    // Find the invitation
    const invitation = await prisma.unitMember.findFirst({
      where: {
        id,
        userId,
        status: 'pending',
      },
      include: {
        unit: true,
      },
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (accept) {
      // Accept the invitation by updating status
      const member = await prisma.unitMember.update({
        where: { id },
        data: { status: 'active' },
        include: {
          unit: true,
        },
      });

      return res.status(200).json({ 
        message: 'Invitation accepted successfully',
        data: member
      });
    } else {
      // Reject by deleting the invitation
      await prisma.unitMember.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Invitation rejected successfully' });
    }
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return res.status(500).json({ message: 'Error responding to invitation' });
  }
};