// driver-jwt-auth.guard.ts
import { AuthGuard } from '@nestjs/passport';

export class DriverJwtAuthGuard extends AuthGuard('driver-token') {}