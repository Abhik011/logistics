import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

async login(email: string, password: string) {
  console.log("Login attempt:", email, password);

  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  console.log("User found:", !!user);

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  console.log("Password match:", isMatch);

  if (!isMatch) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async register(
  name: string,
  email: string,
  password: string,
  role: Role,
) {
  const hashed = await bcrypt.hash(password, 10);

  return this.prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
    },
  });
}
}