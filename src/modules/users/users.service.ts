import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UserRole } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        nipNuptk: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { fullName: "asc" },
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        nipNuptk: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        picRooms: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Pengguna tidak ditemukan");
    }

    return user;
  }

  async toggleUserActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Pengguna tidak ditemukan");

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, username: true, isActive: true },
    });
  }
}
