import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.identifier }, { email: dto.identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Username atau kata sandi salah");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Akun dinonaktifkan. Hubungi administrator.");
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Username atau kata sandi salah");
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existing) {
      throw new ConflictException("Username atau email sudah digunakan");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        nipNuptk: dto.nipNuptk,
        phoneNumber: dto.phoneNumber,
        role: dto.role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    return newUser;
  }
}
